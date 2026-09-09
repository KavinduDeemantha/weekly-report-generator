import 'dotenv/config';

import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const manager = await prisma.user.upsert({
    where: {
      email: 'kavindu@gmail.com',
    },
    update: {},
    create: {
      name: 'Kavindu Deemantha',
      email: 'kavindu@gmail.com',
      passwordHash,
      role: 'MANAGER',
    },
  });

  const memberData = [
    {
      name: 'Sunil Fernando',
      email: 'sunil@gmail.com',
    },
    {
      name: 'Nimal Perera',
      email: 'nimal@gmail.com',
    },
    {
      name: 'Kamal Silva',
      email: 'kamal@gmail.com',
    },
    {
      name: 'Amal Dias',
      email: 'amal@gmail.com',
    },
    {
      name: 'Priya Jayawardena',
      email: 'priya@gmail.com',
    },
  ];

  const members = [];

  for (const member of memberData) {
    const createdMember = await prisma.user.upsert({
      where: {
        email: member.email,
      },
      update: {},
      create: {
        name: member.name,
        email: member.email,
        passwordHash,
        role: 'TEAM_MEMBER',
      },
    });

    members.push(createdMember);
  }

  const clientPortal = await prisma.project.upsert({
    where: {
      name: 'Client Portal',
    },
    update: {},
    create: {
      name: 'Client Portal',
      description: 'Customer-facing web portal',
    },
  });

  const internalTooling = await prisma.project.upsert({
    where: {
      name: 'Internal Tooling',
    },
    update: {},
    create: {
      name: 'Internal Tooling',
      description: 'Internal productivity tools',
    },
  });

  const research = await prisma.project.upsert({
    where: {
      name: 'R&D',
    },
    update: {},
    create: {
      name: 'R&D',
      description: 'Research and experimental work',
    },
  });

  await prisma.projectMember.deleteMany({
    where: {
      OR: [
        { userId: { in: members.map((member) => member.id) } },
        {
          projectId: {
            in: [clientPortal.id, internalTooling.id, research.id],
          },
        },
      ],
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { userId: members[0].id, projectId: clientPortal.id },
      { userId: members[0].id, projectId: internalTooling.id },
      { userId: members[0].id, projectId: research.id },
      { userId: members[1].id, projectId: internalTooling.id },
      { userId: members[2].id, projectId: research.id },
      { userId: members[3].id, projectId: clientPortal.id },
      { userId: members[4].id, projectId: clientPortal.id },
      { userId: members[4].id, projectId: research.id },
    ],
  });

  await prisma.report.deleteMany({
    where: {
      userId: {
        in: members.map((member) => member.id),
      },
    },
  });

  await createSeedReport({
    userId: members[0].id,
    projectId: clientPortal.id,
    weekStart: '2026-08-03',
    weekEnd: '2026-08-09',
    status: 'DRAFT',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        submittedAt: null,
        notes: 'Draft report for manual editing.',
      },
    ],
  });

  await createSeedReport({
    userId: members[0].id,
    projectId: clientPortal.id,
    weekStart: '2026-09-07',
    weekEnd: '2026-09-09',
    status: 'SUBMITTED',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        submittedAt: new Date('2026-09-09T09:00:00.000Z'),
        notes: 'Submitted client portal progress.',
        tasks: [
          {
            name: 'Build report filters',
            priority: 'HIGH',
            plannedPercentage: 100,
            actualPercentage: 100,
            status: 'COMPLETED',
            plannedHours: 8,
            actualHours: 7,
            deliverable: 'Filter API',
          },
          {
            name: 'Polish validation messages',
            priority: 'MEDIUM',
            plannedPercentage: 80,
            actualPercentage: 60,
            status: 'IN_PROGRESS',
            plannedHours: 4,
            actualHours: 3,
            deliverable: 'Validation cleanup',
          },
        ],
        blockers: [
          {
            description: 'Waiting for final copy',
            isKeyIssue: true,
            isResolved: false,
          },
        ],
        timeEntries: [
          { type: 'DEVELOPMENT', hours: 18 },
          { type: 'TESTING', hours: 5 },
        ],
      },
    ],
  });

  await createSeedReport({
    userId: members[1].id,
    projectId: internalTooling.id,
    weekStart: '2026-09-07',
    weekEnd: '2026-09-09',
    status: 'APPROVED',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        submittedAt: new Date('2026-09-09T10:00:00.000Z'),
        notes: 'Approved internal tooling progress.',
        tasks: [
          {
            name: 'Improve seed data',
            priority: 'MEDIUM',
            plannedPercentage: 100,
            actualPercentage: 100,
            status: 'COMPLETED',
            plannedHours: 5,
            actualHours: 5,
            deliverable: 'Dashboard seed dataset',
          },
          {
            name: 'Document dashboard metrics',
            priority: 'LOW',
            plannedPercentage: 100,
            actualPercentage: 100,
            status: 'COMPLETED',
            plannedHours: 3,
            actualHours: 2.5,
            deliverable: 'README section',
          },
        ],
        review: {
          reviewerId: manager.id,
          action: 'APPROVED',
          comment: null,
        },
        timeEntries: [
          { type: 'DOCUMENTATION', hours: 6 },
          { type: 'MEETINGS', hours: 2 },
        ],
      },
    ],
  });

  await createSeedReport({
    userId: members[2].id,
    projectId: research.id,
    weekStart: '2026-09-07',
    weekEnd: '2026-09-09',
    status: 'NEEDS_CORRECTION',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        submittedAt: new Date('2026-09-09T11:00:00.000Z'),
        notes: 'Research report needing correction.',
        tasks: [
          {
            name: 'Evaluate export options',
            priority: 'HIGH',
            plannedPercentage: 100,
            actualPercentage: 70,
            status: 'BLOCKED',
            plannedHours: 8,
            actualHours: 5,
            deliverable: 'Export recommendation draft',
          },
          {
            name: 'Prototype chart payloads',
            priority: 'MEDIUM',
            plannedPercentage: 100,
            actualPercentage: 100,
            status: 'COMPLETED',
            plannedHours: 6,
            actualHours: 6,
            deliverable: 'Prototype JSON payloads',
          },
        ],
        blockers: [
          {
            description: 'Need manager decision on export format',
            isKeyIssue: true,
            isResolved: false,
          },
          {
            description: 'Local test data was incomplete',
            isKeyIssue: false,
            isResolved: true,
          },
        ],
        review: {
          reviewerId: manager.id,
          action: 'REQUEST_CHANGES',
          comment: 'Please add more detail about the blocked export task.',
        },
        timeEntries: [
          { type: 'DEVELOPMENT', hours: 10 },
          { type: 'TESTING', hours: 4 },
          { type: 'MEETINGS', hours: 1 },
        ],
      },
    ],
  });

  await createSeedReport({
    userId: members[3].id,
    projectId: clientPortal.id,
    weekStart: '2026-09-07',
    weekEnd: '2026-09-09',
    status: 'DRAFT',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        submittedAt: null,
        notes: 'Draft dashboard API report.',
        tasks: [
          {
            name: 'Start dashboard controller',
            priority: 'HIGH',
            plannedPercentage: 100,
            actualPercentage: 40,
            status: 'IN_PROGRESS',
            plannedHours: 8,
            actualHours: 3,
            deliverable: 'Controller draft',
          },
        ],
        timeEntries: [
          { type: 'DEVELOPMENT', hours: 8 },
          { type: 'MEETINGS', hours: 1 },
        ],
      },
    ],
  });

  await createSeedReport({
    userId: members[1].id,
    projectId: internalTooling.id,
    weekStart: '2026-08-31',
    weekEnd: '2026-09-06',
    status: 'SUBMITTED',
    currentVersion: 2,
    versions: [
      {
        versionNumber: 1,
        submittedAt: new Date('2026-09-06T09:00:00.000Z'),
        notes: 'Original dashboard metrics implementation.',
        tasks: [
          {
            name: 'Initial dashboard aggregation',
            priority: 'HIGH',
            plannedPercentage: 100,
            actualPercentage: 85,
            status: 'COMPLETED',
            plannedHours: 10,
            actualHours: 9,
            deliverable: 'Initial aggregation service',
          },
        ],
        review: {
          reviewerId: manager.id,
          action: 'REQUEST_CHANGES',
          comment: 'Please make the current-version counting rule explicit.',
        },
      },
      {
        versionNumber: 2,
        submittedAt: new Date('2026-09-07T09:00:00.000Z'),
        notes: 'Corrected dashboard metrics implementation.',
        tasks: [
          {
            name: 'Current-version analytics fix',
            priority: 'HIGH',
            plannedPercentage: 100,
            actualPercentage: 100,
            status: 'COMPLETED',
            plannedHours: 6,
            actualHours: 6,
            deliverable: 'Corrected dashboard aggregation',
          },
          {
            name: 'Dashboard E2E scenarios',
            priority: 'MEDIUM',
            plannedPercentage: 100,
            actualPercentage: 100,
            status: 'COMPLETED',
            plannedHours: 4,
            actualHours: 4,
            deliverable: 'Dashboard test coverage',
          },
        ],
        timeEntries: [
          { type: 'DEVELOPMENT', hours: 12 },
          { type: 'TESTING', hours: 6 },
          { type: 'DOCUMENTATION', hours: 2 },
        ],
      },
    ],
  });

  await createSeedReport({
    userId: members[0].id,
    projectId: internalTooling.id,
    weekStart: '2026-08-10',
    weekEnd: '2026-08-16',
    status: 'SUBMITTED',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        submittedAt: new Date('2026-08-16T09:00:00.000Z'),
        notes: 'Submitted report awaiting manager review.',
      },
    ],
  });

  await createSeedReport({
    userId: members[0].id,
    projectId: research.id,
    weekStart: '2026-08-17',
    weekEnd: '2026-08-23',
    status: 'NEEDS_CORRECTION',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        submittedAt: new Date('2026-08-23T09:00:00.000Z'),
        notes: 'Submitted report with manager feedback.',
        review: {
          reviewerId: manager.id,
          action: 'REQUEST_CHANGES',
          comment: 'Please clarify the main deliverable and blocker status.',
        },
      },
    ],
  });

  await createSeedReport({
    userId: members[0].id,
    projectId: clientPortal.id,
    weekStart: '2026-08-24',
    weekEnd: '2026-08-30',
    status: 'APPROVED',
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        submittedAt: new Date('2026-08-30T09:00:00.000Z'),
        notes: 'Approved weekly report.',
        review: {
          reviewerId: manager.id,
          action: 'APPROVED',
          comment: null,
        },
      },
    ],
  });

  await createSeedReport({
    userId: members[0].id,
    projectId: internalTooling.id,
    weekStart: '2026-08-31',
    weekEnd: '2026-09-06',
    status: 'SUBMITTED',
    currentVersion: 2,
    versions: [
      {
        versionNumber: 1,
        submittedAt: new Date('2026-09-06T09:00:00.000Z'),
        notes: 'Original submitted version before correction.',
        review: {
          reviewerId: manager.id,
          action: 'REQUEST_CHANGES',
          comment: 'Please add more detail about testing coverage.',
        },
      },
      {
        versionNumber: 2,
        submittedAt: new Date('2026-09-07T09:00:00.000Z'),
        notes: 'Corrected version after manager feedback.',
      },
    ],
  });

  console.log({
    manager: manager.email,
    members: members.map((member) => member.email),
    projects: [
      clientPortal.name,
      internalTooling.name,
      research.name,
    ],
  });
}

async function createSeedReport(input: {
  userId: string;
  projectId: string;
  weekStart: string;
  weekEnd: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
  currentVersion: number;
  versions: Array<{
    versionNumber: number;
    submittedAt: Date | null;
    notes: string;
    tasks?: Array<{
      name: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      plannedPercentage: number;
      actualPercentage: number;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
      plannedHours?: number;
      actualHours?: number;
      deliverable?: string;
    }>;
    blockers?: Array<{
      description: string;
      isKeyIssue: boolean;
      isResolved: boolean;
    }>;
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
        notes: versionInput.notes,
        tasks: {
          create: versionInput.tasks ?? [
            {
              name: `Version ${versionInput.versionNumber} implementation work`,
              priority: 'HIGH',
              plannedPercentage: 100,
              actualPercentage: versionInput.versionNumber === 1 ? 85 : 100,
              status: 'COMPLETED',
              plannedHours: 8,
              actualHours: versionInput.versionNumber === 1 ? 7 : 8,
              deliverable: `Version ${versionInput.versionNumber} deliverable`,
            },
          ],
        },
        nextWeekTasks: {
          create: [{ description: 'Continue with the next milestone' }],
        },
        blockers: {
          create: versionInput.blockers ?? [
            {
              description: 'No active blockers',
              isKeyIssue: false,
              isResolved: true,
            },
          ],
        },
        achievements: {
          create: [
            {
              description: 'Completed planned weekly work',
              isKeyAchievement: true,
            },
          ],
        },
        timeEntries: {
          create: versionInput.timeEntries ?? [
            { type: 'DEVELOPMENT', hours: 24 },
            { type: 'MEETINGS', hours: 3 },
          ],
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
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
