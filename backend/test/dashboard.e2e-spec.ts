import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app-bootstrap.js';
import { Role } from '../src/generated/prisma/enums.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Manager Dashboard Analytics (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let marker: string;
  let managerCookie: string;
  let memberCookie: string;
  let managerId: string;
  let submittedUserId: string;
  let needsCorrectionUserId: string;
  let approvedUserId: string;
  let draftUserId: string;
  let noReportUserId: string;
  let projectId: string;
  let otherProjectId: string;

  const password = 'Password123!';
  const weekStart = '2028-02-07';
  const weekEnd = '2028-02-13';

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
    marker = `dashboard-e2e-${Date.now()}`;

    const manager = await createUser('Dashboard Manager', managerEmail(), Role.MANAGER);
    managerId = manager.id;
    const submittedUser = await createUser(
      'Dashboard Submitted',
      submittedEmail(),
      Role.TEAM_MEMBER,
    );
    const needsCorrectionUser = await createUser(
      'Dashboard Needs Correction',
      needsCorrectionEmail(),
      Role.TEAM_MEMBER,
    );
    const approvedUser = await createUser(
      'Dashboard Approved',
      approvedEmail(),
      Role.TEAM_MEMBER,
    );
    const draftUser = await createUser('Dashboard Draft', draftEmail(), Role.TEAM_MEMBER);
    const noReportUser = await createUser(
      'Dashboard No Report',
      noReportEmail(),
      Role.TEAM_MEMBER,
    );

    submittedUserId = submittedUser.id;
    needsCorrectionUserId = needsCorrectionUser.id;
    approvedUserId = approvedUser.id;
    draftUserId = draftUser.id;
    noReportUserId = noReportUser.id;

    projectId = (
      await prisma.project.create({
        data: { name: `${marker} Main Project` },
      })
    ).id;
    otherProjectId = (
      await prisma.project.create({
        data: { name: `${marker} Other Project` },
      })
    ).id;

    await createReport({
      userId: submittedUserId,
      projectId,
      weekStart,
      weekEnd,
      status: 'SUBMITTED',
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          submittedAt: new Date('2028-02-13T09:00:00.000Z'),
          completedTasks: 2,
          inProgressTasks: 1,
          openBlockers: 1,
          resolvedBlockers: 1,
          timeEntries: [
            { type: 'DEVELOPMENT', hours: 5 },
            { type: 'TESTING', hours: 2 },
          ],
        },
      ],
    });
    await createReport({
      userId: needsCorrectionUserId,
      projectId,
      weekStart,
      weekEnd,
      status: 'NEEDS_CORRECTION',
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          submittedAt: new Date('2028-02-13T10:00:00.000Z'),
          completedTasks: 1,
          blockedTasks: 1,
          openBlockers: 1,
          timeEntries: [{ type: 'MEETINGS', hours: 3 }],
          review: {
            reviewerId: manager.id,
            action: 'REQUEST_CHANGES',
            comment: 'Clarify dashboard blocker.',
          },
        },
      ],
    });
    await createReport({
      userId: approvedUserId,
      projectId,
      weekStart,
      weekEnd,
      status: 'APPROVED',
      currentVersion: 2,
      versions: [
        {
          versionNumber: 1,
          submittedAt: new Date('2028-02-13T11:00:00.000Z'),
          completedTasks: 10,
          openBlockers: 4,
          timeEntries: [{ type: 'DEVELOPMENT', hours: 100 }],
          review: {
            reviewerId: manager.id,
            action: 'REQUEST_CHANGES',
            comment: 'Historical version should not count.',
          },
        },
        {
          versionNumber: 2,
          submittedAt: new Date('2028-02-14T09:00:00.000Z'),
          completedTasks: 3,
          openBlockers: 0,
          timeEntries: [
            { type: 'DEVELOPMENT', hours: 4 },
            { type: 'DOCUMENTATION', hours: 1 },
          ],
          review: {
            reviewerId: manager.id,
            action: 'APPROVED',
            comment: null,
          },
        },
      ],
    });
    await createReport({
      userId: draftUserId,
      projectId,
      weekStart,
      weekEnd,
      status: 'DRAFT',
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          submittedAt: null,
          completedTasks: 0,
          inProgressTasks: 1,
          openBlockers: 1,
          timeEntries: [{ type: 'DEVELOPMENT', hours: 2 }],
        },
      ],
    });
    await createReport({
      userId: submittedUserId,
      projectId: otherProjectId,
      weekStart: '2028-02-14',
      weekEnd: '2028-02-20',
      status: 'SUBMITTED',
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          submittedAt: new Date('2028-02-20T09:00:00.000Z'),
          completedTasks: 1,
          timeEntries: [{ type: 'OTHER', hours: 9 }],
        },
      ],
    });

    managerCookie = await loginAndGetCookie(managerEmail());
    memberCookie = await loginAndGetCookie(submittedEmail());
  }, 30_000);

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
      await prisma.project.deleteMany({ where: { name: { contains: marker } } });
      await prisma.user.deleteMany({
        where: { email: { endsWith: `-${marker}@example.com` } },
      });
    }

    if (app) {
      await app.close();
    }
  }, 30_000);

  it('TEAM_MEMBER cannot access dashboard endpoints', async () => {
    await request(app.getHttpServer())
      .get(`/dashboard/summary?weekStart=${weekStart}&userId=${submittedUserId}`)
      .set('Cookie', memberCookie)
      .expect(403);
  });

  it('MANAGER can access every dashboard endpoint', async () => {
    const query = `weekStart=${weekStart}&userId=${submittedUserId}&projectId=${projectId}`;

    await request(app.getHttpServer())
      .get(`/dashboard/summary?${query}`)
      .set('Cookie', managerCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/dashboard/submission-status?${query}`)
      .set('Cookie', managerCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/dashboard/task-trends?from=2028-02-01&to=2028-02-28&projectId=${projectId}`)
      .set('Cookie', managerCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/dashboard/project-distribution?from=2028-02-01&to=2028-02-28&projectId=${projectId}`)
      .set('Cookie', managerCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/dashboard/time-distribution?from=2028-02-01&to=2028-02-28&projectId=${projectId}`)
      .set('Cookie', managerCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/dashboard/activity?from=2028-02-01&to=2028-02-28&projectId=${projectId}`)
      .set('Cookie', managerCookie)
      .expect(200);
  });

  it('manager reports supports exact weekStart filters for dashboard drill-downs', async () => {
    const response = await request(app.getHttpServer())
      .get(`/manager/reports?weekStart=${weekStart}&projectId=${projectId}&limit=100`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body.data).toHaveLength(4);
    expect(
      response.body.data.every(
        (report: { weekStart: string; project: { id: string } }) =>
          report.weekStart === '2028-02-07T00:00:00.000Z' &&
          report.project.id === projectId,
      ),
    ).toBe(true);
  });

  it('manager reports supports submitted-related statusIn filters for dashboard drill-downs', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/manager/reports?weekStart=${weekStart}&projectId=${projectId}&statusIn=SUBMITTED,NEEDS_CORRECTION,APPROVED&limit=100`,
      )
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body.data).toHaveLength(3);
    expect(response.body.data.map((report: { status: string }) => report.status).sort()).toEqual([
      'APPROVED',
      'NEEDS_CORRECTION',
      'SUBMITTED',
    ]);
  });

  it('manager reports rejects malformed statusIn filters', async () => {
    await request(app.getHttpServer())
      .get(`/manager/reports?statusIn=SUBMITTED,UNKNOWN_STATUS`)
      .set('Cookie', managerCookie)
      .expect(400);
  });

  it('summary metrics count compliance, pending states, and current open blockers correctly', async () => {
    const submittedSummary = await getSummary(submittedUserId);
    const needsCorrectionSummary = await getSummary(needsCorrectionUserId);
    const approvedSummary = await getSummary(approvedUserId);
    const draftSummary = await getSummary(draftUserId);
    const noReportSummary = await getSummary(noReportUserId);

    expect(submittedSummary).toMatchObject({
      totalReportsSubmitted: 1,
      submissionComplianceRate: 100,
      pendingCount: 0,
      needsCorrectionCount: 0,
      openBlockersCount: 1,
    });
    expect(needsCorrectionSummary).toMatchObject({
      totalReportsSubmitted: 1,
      submissionComplianceRate: 100,
      pendingCount: 0,
      needsCorrectionCount: 1,
      openBlockersCount: 1,
    });
    expect(approvedSummary).toMatchObject({
      totalReportsSubmitted: 1,
      submissionComplianceRate: 100,
      pendingCount: 0,
      needsCorrectionCount: 0,
      openBlockersCount: 0,
    });
    expect(draftSummary).toMatchObject({
      totalReportsSubmitted: 0,
      submissionComplianceRate: 0,
      pendingCount: 1,
      openBlockersCount: 1,
    });
    expect(noReportSummary).toMatchObject({
      totalReportsSubmitted: 0,
      submissionComplianceRate: 0,
      pendingCount: 1,
      openBlockersCount: 0,
    });
  });

  it('submission status includes NOT_STARTED members', async () => {
    const response = await request(app.getHttpServer())
      .get(`/dashboard/submission-status?weekStart=${weekStart}&userId=${noReportUserId}`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body).toEqual([
      {
        user: {
          id: noReportUserId,
          name: 'Dashboard No Report',
          email: noReportEmail(),
        },
        status: 'NOT_STARTED',
        report: null,
      },
    ]);
  });

  it('summary respects date range filters instead of falling back to the current week', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/dashboard/summary?from=2028-02-14&to=2028-02-20&userId=${submittedUserId}&projectId=${otherProjectId}`,
      )
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body).toMatchObject({
      totalReportsSubmitted: 1,
      submissionComplianceRate: 100,
      pendingCount: 0,
      needsCorrectionCount: 0,
      openBlockersCount: 0,
    });
  });

  it('submission status returns approved report context for the selected range', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/dashboard/submission-status?from=2028-02-01&to=2028-02-28&userId=${approvedUserId}&projectId=${projectId}`,
      )
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body).toEqual([
      {
        user: {
          id: approvedUserId,
          name: 'Dashboard Approved',
          email: approvedEmail(),
        },
        status: 'APPROVED',
        report: {
          id: expect.any(String),
          weekStart: '2028-02-07T00:00:00.000Z',
          project: {
            id: projectId,
            name: `${marker} Main Project`,
          },
        },
      },
    ]);
  });

  it('resubmitted multi-version reports count once in submitted totals', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/dashboard/summary?weekStart=${weekStart}&userId=${approvedUserId}&projectId=${projectId}`,
      )
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body.totalReportsSubmitted).toBe(1);
  });

  it('task trends count completed tasks from current versions only', async () => {
    const response = await request(app.getHttpServer())
      .get(`/dashboard/task-trends?weekStart=${weekStart}&projectId=${projectId}`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body).toEqual([
      {
        weekStart,
        completedTasks: 6,
      },
    ]);
  });

  it('project distribution respects filters and avoids historical double-counting', async () => {
    const response = await request(app.getHttpServer())
      .get(`/dashboard/project-distribution?from=2028-02-01&to=2028-02-28&projectId=${projectId}`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body).toEqual([
      {
        projectId,
        projectName: `${marker} Main Project`,
        taskCount: 9,
      },
    ]);
  });

  it('time distribution sums current-version hours correctly', async () => {
    const response = await request(app.getHttpServer())
      .get(`/dashboard/time-distribution?weekStart=${weekStart}&projectId=${projectId}`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(response.body).toEqual([
      { type: 'DEVELOPMENT', hours: 11 },
      { type: 'DOCUMENTATION', hours: 1 },
      { type: 'MEETINGS', hours: 3 },
      { type: 'TESTING', hours: 2 },
    ]);
  });

  it('activity feed includes submissions, request changes, and approvals with filters', async () => {
    const response = await request(app.getHttpServer())
      .get(`/dashboard/activity?from=2028-02-01&to=2028-02-28&projectId=${projectId}&limit=20`)
      .set('Cookie', managerCookie)
      .expect(200);

    const types = response.body.map((item: { type: string }) => item.type);

    expect(types).toContain('REPORT_SUBMITTED');
    expect(types).toContain('REPORT_RESUBMITTED');
    expect(types).toContain('CHANGES_REQUESTED');
    expect(types).toContain('REPORT_APPROVED');
    expect(
      response.body.some(
        (item: {
          type: string;
          versionNumber?: number;
          reviewer?: { id: string };
        }) =>
          item.type === 'CHANGES_REQUESTED' &&
          item.versionNumber === 1 &&
          item.reviewer?.id === managerId,
      ),
    ).toBe(true);
    expect(
      response.body.every(
        (item: { project: { id: string } }) => item.project.id === projectId,
      ),
    ).toBe(true);
  });

  async function getSummary(userId: string) {
    const response = await request(app.getHttpServer())
      .get(`/dashboard/summary?weekStart=${weekStart}&userId=${userId}&projectId=${projectId}`)
      .set('Cookie', managerCookie)
      .expect(200);

    return response.body;
  }

  async function createUser(name: string, email: string, role: Role) {
    return prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role,
      },
    });
  }

  async function createReport(input: {
    userId: string;
    projectId: string;
    weekStart: string;
    weekEnd: string;
    status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
    currentVersion: number;
    versions: Array<{
      versionNumber: number;
      submittedAt: Date | null;
      completedTasks: number;
      inProgressTasks?: number;
      blockedTasks?: number;
      openBlockers?: number;
      resolvedBlockers?: number;
      timeEntries?: Array<{
        type: 'DEVELOPMENT' | 'TESTING' | 'MEETINGS' | 'DOCUMENTATION' | 'OTHER';
        hours: number;
      }>;
      review?: {
        reviewerId: string;
        action: 'REQUEST_CHANGES' | 'APPROVED';
        comment: string | null;
      };
    }>;
  }) {
    const report = await prisma.report.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        weekStart: new Date(`${input.weekStart}T00:00:00.000Z`),
        weekEnd: new Date(`${input.weekEnd}T00:00:00.000Z`),
        status: input.status,
        currentVersion: input.currentVersion,
      },
    });

    for (const versionInput of input.versions) {
      const version = await prisma.reportVersion.create({
        data: {
          reportId: report.id,
          versionNumber: versionInput.versionNumber,
          submittedAt: versionInput.submittedAt,
          notes: `${marker} version ${versionInput.versionNumber}`,
          tasks: {
            create: createTasks(versionInput),
          },
          blockers: {
            create: [
              ...createBlockers(versionInput.openBlockers ?? 0, false),
              ...createBlockers(versionInput.resolvedBlockers ?? 0, true),
            ],
          },
          achievements: {
            create: [{ description: `${marker} achievement`, isKeyAchievement: true }],
          },
          nextWeekTasks: {
            create: [{ description: `${marker} next task` }],
          },
          timeEntries: {
            create: versionInput.timeEntries ?? [],
          },
        },
      });

      if (versionInput.review) {
        await prisma.review.create({
          data: {
            reportId: report.id,
            reportVersionId: version.id,
            reviewerId: versionInput.review.reviewerId,
            action: versionInput.review.action,
            comment: versionInput.review.comment,
          },
        });
      }
    }

    return report;
  }

  function createTasks(input: {
    completedTasks: number;
    inProgressTasks?: number;
    blockedTasks?: number;
  }) {
    return [
      ...Array.from({ length: input.completedTasks }, (_, index) => ({
        name: `${marker} completed task ${index + 1}`,
        priority: 'HIGH' as const,
        plannedPercentage: 100,
        actualPercentage: 100,
        status: 'COMPLETED' as const,
        plannedHours: 1,
        actualHours: 1,
      })),
      ...Array.from({ length: input.inProgressTasks ?? 0 }, (_, index) => ({
        name: `${marker} in-progress task ${index + 1}`,
        priority: 'MEDIUM' as const,
        plannedPercentage: 100,
        actualPercentage: 50,
        status: 'IN_PROGRESS' as const,
        plannedHours: 1,
        actualHours: 0.5,
      })),
      ...Array.from({ length: input.blockedTasks ?? 0 }, (_, index) => ({
        name: `${marker} blocked task ${index + 1}`,
        priority: 'CRITICAL' as const,
        plannedPercentage: 100,
        actualPercentage: 25,
        status: 'BLOCKED' as const,
        plannedHours: 1,
        actualHours: 0.25,
      })),
    ];
  }

  function createBlockers(count: number, isResolved: boolean) {
    return Array.from({ length: count }, (_, index) => ({
      description: `${marker} ${isResolved ? 'resolved' : 'open'} blocker ${index + 1}`,
      isKeyIssue: !isResolved && index === 0,
      isResolved,
    }));
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

  function submittedEmail(): string {
    return `submitted-${marker}@example.com`;
  }

  function needsCorrectionEmail(): string {
    return `needs-correction-${marker}@example.com`;
  }

  function approvedEmail(): string {
    return `approved-${marker}@example.com`;
  }

  function draftEmail(): string {
    return `draft-${marker}@example.com`;
  }

  function noReportEmail(): string {
    return `no-report-${marker}@example.com`;
  }
});
