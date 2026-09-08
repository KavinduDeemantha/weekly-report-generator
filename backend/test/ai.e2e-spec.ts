import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { vi } from 'vitest';

const geminiMocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  GoogleGenAI: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: geminiMocks.GoogleGenAI,
  Type: {
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
    STRING: 'STRING',
  },
}));

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app-bootstrap.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('AI report assistant (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let emailSuffix: string;
  let memberCookie: string;
  let managerCookie: string;

  const password = 'Password123!';

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_MODEL = 'test-model';

    geminiMocks.GoogleGenAI.mockImplementation(function GoogleGenAIMock() {
      return {
        models: {
          generateContent: geminiMocks.generateContent,
        },
      };
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    emailSuffix = `${Date.now()}-ai@example.com`;

    const memberEmail = `ai-member-${emailSuffix}`;
    const managerEmail = `ai-manager-${emailSuffix}`;

    await createUser({
      name: 'AI Member',
      email: memberEmail,
      password,
      role: 'TEAM_MEMBER',
    });
    await createUser({
      name: 'AI Manager',
      email: managerEmail,
      password,
      role: 'MANAGER',
    });

    memberCookie = await loginAndGetCookie(memberEmail, password);
    managerCookie = await loginAndGetCookie(managerEmail, password);
  });

  beforeEach(() => {
    geminiMocks.generateContent.mockReset();
  });

  afterAll(async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;

    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: {
            endsWith: emailSuffix,
          },
        },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('allows TEAM_MEMBER users to request a report suggestion', async () => {
    geminiMocks.generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        action: 'SUMMARIZE_WEEK',
        suggestion: 'Completed authentication work and identified follow-up testing.',
      }),
    });

    const response = await request(app.getHttpServer())
      .post('/ai/report-assistant')
      .set('Cookie', memberCookie)
      .send({
        action: 'SUMMARIZE_WEEK',
        context: {
          tasks: [
            {
              name: 'Implement authentication',
              priority: 'HIGH',
              plannedPercentage: 100,
              actualPercentage: 100,
              status: 'COMPLETED',
              plannedHours: 8,
              actualHours: 7,
              deliverable: 'Auth module',
            },
          ],
          notes: 'Authentication milestone completed.',
        },
      })
      .expect(200);

    expect(response.body).toEqual({
      action: 'SUMMARIZE_WEEK',
      suggestion: 'Completed authentication work and identified follow-up testing.',
    });
    expect(geminiMocks.generateContent).toHaveBeenCalledTimes(1);
    expect(geminiMocks.generateContent.mock.calls[0][0].model).toBe('test-model');
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .post('/ai/report-assistant')
      .send(validAssistantRequest())
      .expect(401);
  });

  it('rejects MANAGER users because the assistant is member-only', async () => {
    await request(app.getHttpServer())
      .post('/ai/report-assistant')
      .set('Cookie', managerCookie)
      .send(validAssistantRequest())
      .expect(403);
  });

  it('rejects invalid assistant actions', async () => {
    await request(app.getHttpServer())
      .post('/ai/report-assistant')
      .set('Cookie', memberCookie)
      .send({
        action: 'WRITE_ANYTHING',
        context: {
          notes: 'Some notes',
        },
      })
      .expect(400);
  });

  it('rejects empty report context', async () => {
    await request(app.getHttpServer())
      .post('/ai/report-assistant')
      .set('Cookie', memberCookie)
      .send({
        action: 'SUMMARIZE_WEEK',
        context: {},
      })
      .expect(400);
  });

  it('rejects oversized payloads', async () => {
    await request(app.getHttpServer())
      .post('/ai/report-assistant')
      .set('Cookie', memberCookie)
      .send({
        action: 'IMPROVE_WRITING',
        context: {
          notes: 'x'.repeat(2001),
        },
      })
      .expect(400);
  });

  it('maps provider failures to a safe response', async () => {
    geminiMocks.generateContent.mockRejectedValueOnce(new Error('provider failed'));

    const response = await request(app.getHttpServer())
      .post('/ai/report-assistant')
      .set('Cookie', memberCookie)
      .send(validAssistantRequest())
      .expect(502);

    expect(response.body.message).toBe('AI assistant is temporarily unavailable');
    expect(JSON.stringify(response.body)).not.toContain('test-gemini-key');
  });

  function validAssistantRequest() {
    return {
      action: 'IMPROVE_BLOCKERS',
      context: {
        blockers: [
          {
            description: 'Waiting for API credentials',
            isKeyIssue: true,
            isResolved: false,
          },
        ],
      },
    };
  }

  async function createUser(input: {
    name: string;
    email: string;
    password: string;
    role: 'TEAM_MEMBER' | 'MANAGER';
  }) {
    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 12),
        role: input.role,
      },
    });
  }

  async function loginAndGetCookie(
    email: string,
    userPassword: string,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: userPassword })
      .expect(200);

    const cookie = response.headers['set-cookie']?.[0];
    expect(cookie).toBeDefined();

    return cookie;
  }
});
