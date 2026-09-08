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

  const seededWeekStarts = [
    '2026-08-03',
    '2026-08-10',
    '2026-08-17',
    '2026-08-24',
    '2026-08-31',
  ].map((date) => new Date(`${date}T00:00:00.000Z`));

  await prisma.report.deleteMany({
    where: {
      userId: members[0].id,
      weekStart: {
        in: seededWeekStarts,
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
          create: [
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
          create: [
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
          create: [
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
