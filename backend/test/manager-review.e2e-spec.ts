import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app-bootstrap.js';
import { Role } from '../src/generated/prisma/enums.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Manager Review, Correction, Resubmission, and Version History (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let marker: string;
  let managerCookie: string;
  let memberCookie: string;
  let secondMemberCookie: string;
  let managerId: string;
  let memberId: string;
  let projectId: string;

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
    marker = `review-e2e-${Date.now()}`;

    const manager = await createUser({
      name: 'Review Manager',
      email: managerEmail(),
      role: Role.MANAGER,
    });
    const member = await createUser({
      name: 'Review Member',
      email: memberEmail(),
      role: Role.TEAM_MEMBER,
    });
    await createUser({
      name: 'Other Review Member',
      email: secondMemberEmail(),
      role: Role.TEAM_MEMBER,
    });

    managerId = manager.id;
    memberId = member.id;
    projectId = (
      await prisma.project.create({
        data: {
          name: `${marker} Project`,
          description: 'Review workflow project',
        },
      })
    ).id;

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: memberId,
      },
    });

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

  it('runs the full correction workflow and preserves version history', async () => {
    const created = await createReport('2027-01-04', '2027-01-10');

    await request(app.getHttpServer())
      .get('/manager/reports')
      .set('Cookie', memberCookie)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/reports/${created.id}/submit`)
      .set('Cookie', memberCookie)
      .expect(201);

    const managerList = await request(app.getHttpServer())
      .get(`/manager/reports?status=SUBMITTED&userId=${memberId}&projectId=${projectId}&from=2027-01-01&to=2027-01-31`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(
      managerList.body.data.some((report: { id: string }) => report.id === created.id),
    ).toBe(true);

    await request(app.getHttpServer())
      .post(`/manager/reports/${created.id}/request-changes`)
      .set('Cookie', managerCookie)
      .send({ comment: '   ' })
      .expect(400);

    const changeRequest = await request(app.getHttpServer())
      .post(`/manager/reports/${created.id}/request-changes`)
      .set('Cookie', managerCookie)
      .send({ comment: 'Please add clearer deliverable detail.' })
      .expect(201);

    expect(changeRequest.body.status).toBe('NEEDS_CORRECTION');
    expect(changeRequest.body.latestCorrectionFeedback.comment).toBe(
      'Please add clearer deliverable detail.',
    );

    await request(app.getHttpServer())
      .post(`/manager/reports/${created.id}/request-changes`)
      .set('Cookie', managerCookie)
      .send({ comment: 'Repeated request' })
      .expect(400);

    const requestReview = await prisma.review.findFirstOrThrow({
      where: {
        reportId: created.id,
        action: 'REQUEST_CHANGES',
      },
      include: { reportVersion: true },
    });

    expect(requestReview.reviewerId).toBe(managerId);
    expect(requestReview.reportVersion.versionNumber).toBe(1);

    const memberDetail = await request(app.getHttpServer())
      .get(`/reports/${created.id}`)
      .set('Cookie', memberCookie)
      .expect(200);

    expect(memberDetail.body.latestCorrectionFeedback.comment).toBe(
      'Please add clearer deliverable detail.',
    );

    const corrected = await request(app.getHttpServer())
      .patch(`/reports/${created.id}`)
      .set('Cookie', memberCookie)
      .send({
        notes: 'Corrected report notes',
        tasks: [
          {
            name: 'Corrected implementation task',
            priority: 'HIGH',
            plannedPercentage: 100,
            actualPercentage: 100,
            status: 'COMPLETED',
            plannedHours: 8,
            actualHours: 8,
            deliverable: 'Clear corrected deliverable',
          },
        ],
      })
      .expect(200);

    expect(corrected.body.status).toBe('NEEDS_CORRECTION');
    expect(corrected.body.currentVersion).toBe(2);
    expect(corrected.body.version.submittedAt).toBeNull();
    expect(corrected.body.version.tasks[0].name).toBe(
      'Corrected implementation task',
    );

    const versionsAfterFirstEdit = await prisma.reportVersion.findMany({
      where: { reportId: created.id },
      orderBy: { versionNumber: 'asc' },
      include: { tasks: true },
    });

    expect(versionsAfterFirstEdit).toHaveLength(2);
    expect(versionsAfterFirstEdit[0].versionNumber).toBe(1);
    expect(versionsAfterFirstEdit[0].tasks[0].name).toBe('Initial implementation task');
    expect(versionsAfterFirstEdit[1].versionNumber).toBe(2);
    expect(versionsAfterFirstEdit[1].tasks[0].name).toBe(
      'Corrected implementation task',
    );

    await request(app.getHttpServer())
      .patch(`/reports/${created.id}`)
      .set('Cookie', memberCookie)
      .send({
        notes: 'Second correction edit, same version',
        achievements: [
          {
            description: 'Clarified review feedback',
            isKeyAchievement: true,
          },
        ],
      })
      .expect(200);

    const versionCountBeforeResubmit = await prisma.reportVersion.count({
      where: { reportId: created.id },
    });

    expect(versionCountBeforeResubmit).toBe(2);

    const resubmitted = await request(app.getHttpServer())
      .post(`/reports/${created.id}/resubmit`)
      .set('Cookie', memberCookie)
      .expect(201);

    expect(resubmitted.body.status).toBe('SUBMITTED');
    expect(resubmitted.body.currentVersion).toBe(2);
    expect(resubmitted.body.version.submittedAt).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/reports/${created.id}/resubmit`)
      .set('Cookie', memberCookie)
      .expect(400);

    const approved = await request(app.getHttpServer())
      .post(`/manager/reports/${created.id}/approve`)
      .set('Cookie', managerCookie)
      .expect(201);

    expect(approved.body.status).toBe('APPROVED');
    expect(approved.body.currentVersion).toBe(2);

    await request(app.getHttpServer())
      .post(`/manager/reports/${created.id}/approve`)
      .set('Cookie', managerCookie)
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/reports/${created.id}`)
      .set('Cookie', memberCookie)
      .send({ notes: 'Cannot edit approved report' })
      .expect(400);

    const reviews = await prisma.review.findMany({
      where: { reportId: created.id },
      orderBy: { createdAt: 'asc' },
      include: { reportVersion: true },
    });

    expect(reviews).toHaveLength(2);
    expect(reviews[0].action).toBe('REQUEST_CHANGES');
    expect(reviews[0].reportVersion.versionNumber).toBe(1);
    expect(reviews[1].action).toBe('APPROVED');
    expect(reviews[1].reportVersion.versionNumber).toBe(2);

    const finalReport = await prisma.report.findUniqueOrThrow({
      where: { id: created.id },
      include: { versions: { orderBy: { versionNumber: 'asc' } } },
    });

    expect(finalReport.status).toBe('APPROVED');
    expect(finalReport.currentVersion).toBe(2);
    expect(finalReport.versions).toHaveLength(2);
    expect(finalReport.versions[0].submittedAt).toBeTruthy();
    expect(finalReport.versions[1].submittedAt).toBeTruthy();
  });

  it('manager detail includes current version, reviews, user, project, and version summaries', async () => {
    const report = await createSubmittedReport('2027-01-11', '2027-01-17');

    const response = await request(app.getHttpServer())
      .get(`/manager/reports/${report.id}`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body.user).toMatchObject({
      id: memberId,
      email: memberEmail(),
    });
    expect(response.body.project.id).toBe(projectId);
    expect(response.body.version.versionNumber).toBe(1);
    expect(response.body.versionSummaries).toHaveLength(1);
  });

  it('invalid review transitions fail', async () => {
    const draft = await createReport('2027-01-18', '2027-01-24');

    await request(app.getHttpServer())
      .post(`/manager/reports/${draft.id}/approve`)
      .set('Cookie', managerCookie)
      .expect(400);

    await request(app.getHttpServer())
      .post(`/reports/${draft.id}/resubmit`)
      .set('Cookie', memberCookie)
      .expect(400);
  });

  it('version history is visible to owner and manager, but not another member', async () => {
    const report = await createSubmittedReport('2027-01-25', '2027-01-31');

    const ownerVersions = await request(app.getHttpServer())
      .get(`/reports/${report.id}/versions`)
      .set('Cookie', memberCookie)
      .expect(200);

    expect(ownerVersions.body).toHaveLength(1);
    expect(ownerVersions.body[0]).toMatchObject({
      versionNumber: 1,
      isCurrent: true,
    });

    const ownerVersionDetail = await request(app.getHttpServer())
      .get(`/reports/${report.id}/versions/1`)
      .set('Cookie', memberCookie)
      .expect(200);

    expect(ownerVersionDetail.body.tasks[0].name).toBe('Initial implementation task');

    await request(app.getHttpServer())
      .get(`/reports/${report.id}/versions`)
      .set('Cookie', secondMemberCookie)
      .expect(403);

    const managerVersions = await request(app.getHttpServer())
      .get(`/reports/${report.id}/versions`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(managerVersions.body[0].versionNumber).toBe(1);
  });

  async function createSubmittedReport(weekStart: string, weekEnd: string) {
    const report = await createReport(weekStart, weekEnd);

    await request(app.getHttpServer())
      .post(`/reports/${report.id}/submit`)
      .set('Cookie', memberCookie)
      .expect(201);

    return report;
  }

  async function createReport(weekStart: string, weekEnd: string) {
    const response = await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', memberCookie)
      .send(reportPayload(weekStart, weekEnd))
      .expect(201);

    return response.body as { id: string };
  }

  function reportPayload(weekStart: string, weekEnd: string) {
    return {
      weekStart,
      weekEnd,
      projectId,
      notes: 'Initial report notes',
      tasks: [
        {
          name: 'Initial implementation task',
          priority: 'HIGH',
          plannedPercentage: 100,
          actualPercentage: 100,
          status: 'COMPLETED',
          plannedHours: 8,
          actualHours: 7,
          deliverable: 'Initial deliverable',
        },
      ],
      nextWeekTasks: [{ description: 'Follow up on review feedback' }],
      blockers: [{ description: 'No blockers', isKeyIssue: false }],
      achievements: [{ description: 'Submitted report', isKeyAchievement: true }],
      timeEntries: [{ type: 'DEVELOPMENT', hours: 20 }],
    };
  }

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
