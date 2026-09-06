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
      email: 'manager@example.com',
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

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });