import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app-bootstrap.js';
import { Role } from '../src/generated/prisma/enums.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Projects and Reports (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let marker: string;
  let managerCookie: string;
  let memberCookie: string;
  let secondMemberCookie: string;
  let memberId: string;
  let secondMemberId: string;
  let activeProjectId: string;
  let inactiveProjectId: string;

  const password = 'Password123!';

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    marker = `e2e-${Date.now()}`;

    await createUser({
      name: 'Projects Manager',
      email: managerEmail(),
      role: Role.MANAGER,
    });
    const member = await createUser({
      name: 'Reports Member',
      email: memberEmail(),
      role: Role.TEAM_MEMBER,
    });
    const secondMember = await createUser({
      name: 'Second Reports Member',
      email: secondMemberEmail(),
      role: Role.TEAM_MEMBER,
    });

    memberId = member.id;
    secondMemberId = secondMember.id;

    activeProjectId = (
      await prisma.project.create({
        data: {
          name: `${marker} Active Project`,
          description: 'Active e2e project',
        },
      })
    ).id;
    inactiveProjectId = (
      await prisma.project.create({
        data: {
          name: `${marker} Inactive Project`,
          description: 'Inactive e2e project',
          isActive: false,
        },
      })
    ).id;

    managerCookie = await loginAndGetCookie(managerEmail());
    memberCookie = await loginAndGetCookie(memberEmail());
    secondMemberCookie = await loginAndGetCookie(secondMemberEmail());
  });

  afterAll(async () => {
    if (prisma && marker) {
      await prisma.report.deleteMany({
        where: {
          OR: [
            { user: { email: { endsWith: `-${marker}@example.com` } } },
            { project: { name: { contains: marker } } },
          ],
        },
      });
      await prisma.project.deleteMany({
        where: { name: { contains: marker } },
      });
      await prisma.user.deleteMany({
        where: { email: { endsWith: `-${marker}@example.com` } },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('TEAM_MEMBER can list active projects only', async () => {
    const response = await request(app.getHttpServer())
      .get('/projects')
      .set('Cookie', memberCookie)
      .expect(200);

    expect(response.body.data.some((project: { id: string }) => project.id === activeProjectId)).toBe(true);
    expect(
      response.body.data.some((project: { id: string }) => project.id === inactiveProjectId),
    ).toBe(false);
  });

  it('TEAM_MEMBER cannot create projects', async () => {
    await request(app.getHttpServer())
      .post('/projects')
      .set('Cookie', memberCookie)
      .send({ name: `${marker} Forbidden Project` })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/projects/${activeProjectId}`)
      .set('Cookie', memberCookie)
      .send({ name: `${marker} Forbidden Update` })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/projects/${activeProjectId}`)
      .set('Cookie', memberCookie)
      .expect(403);
  });

  it('MANAGER can create a project', async () => {
    const response = await request(app.getHttpServer())
      .post('/projects')
      .set('Cookie', managerCookie)
      .send({
        name: `${marker} Created Project`,
        description: 'Created through e2e',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: `${marker} Created Project`,
      description: 'Created through e2e',
      isActive: true,
    });
  });

  it('duplicate project name returns 409', async () => {
    const name = `${marker} Duplicate Project`;

    await request(app.getHttpServer())
      .post('/projects')
      .set('Cookie', managerCookie)
      .send({ name })
      .expect(201);

    await request(app.getHttpServer())
      .post('/projects')
      .set('Cookie', managerCookie)
      .send({ name })
      .expect(409);
  });

  it('MANAGER can update and deactivate a project', async () => {
    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Cookie', managerCookie)
      .send({ name: `${marker} Mutable Project` })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .patch(`/projects/${created.body.id}`)
      .set('Cookie', managerCookie)
      .send({
        name: `${marker} Updated Project`,
        isActive: true,
      })
      .expect(200);

    expect(updated.body.name).toBe(`${marker} Updated Project`);

    const deactivated = await request(app.getHttpServer())
      .delete(`/projects/${created.body.id}`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(deactivated.body.isActive).toBe(false);
  });

  it('TEAM_MEMBER can create a DRAFT report with versioned content as owner', async () => {
    const response = await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', memberCookie)
      .send({
        ...reportPayload('2026-09-07', '2026-09-13'),
        userId: secondMemberId,
        status: 'SUBMITTED',
        currentVersion: 99,
      })
      .expect(400);

    expect(response.body.message).toContain('property userId should not exist');

    const created = await createReport(memberCookie, '2026-09-07', '2026-09-13');

    expect(created.status).toBe('DRAFT');
    expect(created.currentVersion).toBe(1);
    expect(created.version.versionNumber).toBe(1);
    expect(created.version.tasks).toHaveLength(1);

    const stored = await prisma.report.findUniqueOrThrow({
      where: { id: created.id },
      include: { versions: true },
    });

    expect(stored.userId).toBe(memberId);
    expect(stored.status).toBe('DRAFT');
    expect(stored.currentVersion).toBe(1);
    expect(stored.versions).toHaveLength(1);
  });

  it('duplicate report for same user and week returns 409', async () => {
    await createReport(memberCookie, '2026-09-14', '2026-09-20');

    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', memberCookie)
      .send(reportPayload('2026-09-14', '2026-09-20'))
      .expect(409);
  });

  it('TEAM_MEMBER can paginate and filter only their own reports', async () => {
    await createReport(memberCookie, '2026-09-21', '2026-09-27');
    await createReport(secondMemberCookie, '2026-09-21', '2026-09-27');

    const response = await request(app.getHttpServer())
      .get(`/reports/me?page=1&limit=10&status=DRAFT&projectId=${activeProjectId}&from=2026-09-01&to=2026-09-30`)
      .set('Cookie', memberCookie)
      .expect(200);

    expect(response.body.meta).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 10,
      }),
    );
    expect(response.body.data.length).toBeGreaterThan(0);

    const ownerIds = await prisma.report.findMany({
      where: {
        id: { in: response.body.data.map((report: { id: string }) => report.id) },
      },
      select: { userId: true },
    });

    expect(ownerIds.every((report) => report.userId === memberId)).toBe(true);
  });

  it('TEAM_MEMBER cannot read another member report', async () => {
    const otherReport = await createReport(
      secondMemberCookie,
      '2026-09-28',
      '2026-10-04',
    );

    await request(app.getHttpServer())
      .get(`/reports/${otherReport.id}`)
      .set('Cookie', memberCookie)
      .expect(403);
  });

  it('TEAM_MEMBER can read own report detail', async () => {
    const ownReport = await createReport(memberCookie, '2026-12-07', '2026-12-13');

    const response = await request(app.getHttpServer())
      .get(`/reports/${ownReport.id}`)
      .set('Cookie', memberCookie)
      .expect(200);

    expect(response.body.id).toBe(ownReport.id);
    expect(response.body.version.tasks[0].name).toBe('Implement report APIs');
    expect(response.body.version.timeEntries).toHaveLength(2);
  });

  it('TEAM_MEMBER can edit own DRAFT without creating fake history', async () => {
    const created = await createReport(memberCookie, '2026-10-05', '2026-10-11');

    const response = await request(app.getHttpServer())
      .patch(`/reports/${created.id}`)
      .set('Cookie', memberCookie)
      .send({
        notes: 'Updated draft notes',
        tasks: [
          {
            name: 'Updated implementation task',
            priority: 'MEDIUM',
            plannedPercentage: 80,
            actualPercentage: 60,
            status: 'IN_PROGRESS',
            plannedHours: 10,
            actualHours: 6,
            deliverable: 'Updated draft',
          },
        ],
      })
      .expect(200);

    expect(response.body.version.notes).toBe('Updated draft notes');
    expect(response.body.version.tasks).toHaveLength(1);
    expect(response.body.version.tasks[0].name).toBe('Updated implementation task');

    const versionCount = await prisma.reportVersion.count({
      where: { reportId: created.id },
    });

    expect(versionCount).toBe(1);
  });

  it('TEAM_MEMBER can submit own DRAFT and repeat submit is rejected', async () => {
    const created = await createReport(memberCookie, '2026-10-12', '2026-10-18');

    const submitted = await request(app.getHttpServer())
      .post(`/reports/${created.id}/submit`)
      .set('Cookie', memberCookie)
      .expect(201);

    expect(submitted.body.status).toBe('SUBMITTED');
    expect(submitted.body.version.submittedAt).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/reports/${created.id}/submit`)
      .set('Cookie', memberCookie)
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/reports/${created.id}`)
      .set('Cookie', memberCookie)
      .send({ notes: 'Should not update' })
      .expect(400);
  });

  it('report validation rejects invalid percentages and multiple key flags', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', memberCookie)
      .send({
        ...reportPayload('2026-10-19', '2026-10-25'),
        tasks: [
          {
            name: 'Invalid percentage',
            priority: 'HIGH',
            plannedPercentage: 101,
            actualPercentage: 100,
            status: 'COMPLETED',
          },
        ],
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', memberCookie)
      .send({
        ...reportPayload('2026-10-26', '2026-11-01'),
        blockers: [
          { description: 'First key issue', isKeyIssue: true },
          { description: 'Second key issue', isKeyIssue: true },
        ],
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', memberCookie)
      .send({
        ...reportPayload('2026-11-02', '2026-11-08'),
        achievements: [
          { description: 'First key achievement', isKeyAchievement: true },
          { description: 'Second key achievement', isKeyAchievement: true },
        ],
      })
      .expect(400);
  });

  it('inactive or nonexistent project cannot be used for a new report', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', memberCookie)
      .send({
        ...reportPayload('2026-11-09', '2026-11-15'),
        projectId: inactiveProjectId,
      })
      .expect(404);

    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', memberCookie)
      .send({
        ...reportPayload('2026-11-16', '2026-11-22'),
        projectId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(404);
  });

  async function createUser(input: {
    name: string;
    email: string;
    role: Role;
  }) {
    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await bcrypt.hash(password, 12),
        role: input.role,
      },
    });
  }

  async function loginAndGetCookie(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const cookie = response.headers['set-cookie']?.[0];
    expect(cookie).toBeDefined();

    return cookie;
  }

  async function createReport(
    cookie: string,
    weekStart: string,
    weekEnd: string,
  ): Promise<{
    id: string;
    status: string;
    currentVersion: number;
    version: {
      versionNumber: number;
      submittedAt: string | null;
      tasks: Array<{ name: string }>;
    };
  }> {
    const response = await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', cookie)
      .send(reportPayload(weekStart, weekEnd))
      .expect(201);

    return response.body;
  }

  function reportPayload(weekStart: string, weekEnd: string) {
    return {
      weekStart,
      weekEnd,
      projectId: activeProjectId,
      notes: 'Weekly progress notes',
      tasks: [
        {
          name: 'Implement report APIs',
          priority: 'HIGH',
          plannedPercentage: 100,
          actualPercentage: 100,
          status: 'COMPLETED',
          plannedHours: 8,
          actualHours: 7.5,
          deliverable: 'Reports module',
        },
      ],
      nextWeekTasks: [{ description: 'Prepare manager review APIs' }],
      blockers: [
        {
          description: 'Waiting for credentials',
          isKeyIssue: true,
          isResolved: false,
        },
      ],
      achievements: [
        {
          description: 'Completed milestone foundation',
          isKeyAchievement: true,
        },
      ],
      timeEntries: [
        { type: 'DEVELOPMENT', hours: 24 },
        { type: 'MEETINGS', hours: 4 },
      ],
    };
  }

  function managerEmail(): string {
    return `manager-${marker}@example.com`;
  }

  function memberEmail(): string {
    return `member-${marker}@example.com`;
  }

  function secondMemberEmail(): string {
    return `second-member-${marker}@example.com`;
  }
});
