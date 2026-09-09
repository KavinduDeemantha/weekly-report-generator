import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { configureApp } from '../src/app-bootstrap.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Authentication and RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let emailSuffix: string;

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
    emailSuffix = `${Date.now()}@example.com`;
  });

  afterAll(async () => {
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

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          status: 'ok',
          database: 'ok',
        });
      });
  });

  it('register creates a TEAM_MEMBER without exposing passwordHash', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'John Doe',
        email: `member-register-${emailSuffix}`,
        password,
        role: 'MANAGER',
      })
      .expect(400);

    expect(response.body.message).toContain('property role should not exist');

    const success = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'John Doe',
        email: `MEMBER-REGISTER-${emailSuffix}`,
        password,
      })
      .expect(201);

    expect(success.body).toMatchObject({
      name: 'John Doe',
      email: `member-register-${emailSuffix}`,
      role: 'TEAM_MEMBER',
    });
    expect(success.body.passwordHash).toBeUndefined();

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { email: `member-register-${emailSuffix}` },
    });

    expect(storedUser.role).toBe('TEAM_MEMBER');
    expect(storedUser.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, storedUser.passwordHash)).toBe(true);
  });

  it('duplicate registration returns 409', async () => {
    const email = `duplicate-${emailSuffix}`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Duplicate User',
        email,
        password,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Duplicate User',
        email,
        password,
      })
      .expect(409);
  });

  it('login with correct credentials succeeds and stores JWT in an HTTP-only cookie', async () => {
    const email = `login-success-${emailSuffix}`;

    await createUser({
      name: 'Login User',
      email,
      password,
      role: 'TEAM_MEMBER',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body).toMatchObject({
      name: 'Login User',
      email,
      role: 'TEAM_MEMBER',
    });
    expect(response.body.accessToken).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
    expect(response.headers['set-cookie']?.[0]).toContain('access_token=');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
  });

  it('login with incorrect password returns 401', async () => {
    const email = `login-failure-${emailSuffix}`;

    await createUser({
      name: 'Login Failure User',
      email,
      password,
      role: 'TEAM_MEMBER',
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('protected endpoint without cookie returns 401', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('authenticated /auth/me returns the current user', async () => {
    const email = `me-${emailSuffix}`;

    await createUser({
      name: 'Current User',
      email,
      password,
      role: 'TEAM_MEMBER',
    });

    const cookie = await loginAndGetCookie(email, password);

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toMatchObject({
      name: 'Current User',
      email,
      role: 'TEAM_MEMBER',
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('TEAM_MEMBER cannot access manager-only users list', async () => {
    const email = `rbac-member-${emailSuffix}`;

    await createUser({
      name: 'RBAC Member',
      email,
      password,
      role: 'TEAM_MEMBER',
    });

    const cookie = await loginAndGetCookie(email, password);

    await request(app.getHttpServer())
      .get('/users')
      .set('Cookie', cookie)
      .expect(403);
  });

  it('MANAGER can access manager-only users list', async () => {
    const email = `rbac-manager-${emailSuffix}`;

    await createUser({
      name: 'RBAC Manager',
      email,
      password,
      role: 'MANAGER',
    });

    const cookie = await loginAndGetCookie(email, password);

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        isActive: expect.any(Boolean),
        createdAt: expect.any(String),
      }),
    );
    expect(response.body.data[0].passwordHash).toBeUndefined();
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 20,
      }),
    );
  });

  it('logout clears the access token cookie', async () => {
    const email = `logout-${emailSuffix}`;

    await createUser({
      name: 'Logout User',
      email,
      password,
      role: 'TEAM_MEMBER',
    });

    const cookie = await loginAndGetCookie(email, password);

    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toEqual({ success: true });
    expect(response.headers['set-cookie']?.[0]).toContain('access_token=');
    expect(response.headers['set-cookie']?.[0]).toContain('Expires=Thu, 01 Jan 1970');
  });

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

  async function loginAndGetCookie(email: string, userPassword: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: userPassword })
      .expect(200);

    const cookie = response.headers['set-cookie']?.[0];
    expect(cookie).toBeDefined();

    return cookie;
  }
});
