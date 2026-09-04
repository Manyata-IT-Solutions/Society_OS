import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('IAM & Enterprise Security (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let adminRefreshToken: string;
  let adminSessionId: string;
  let createdRoleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (createdRoleId) {
      await prisma.role.delete({ where: { id: createdRoleId } }).catch(() => {});
    }
    await app.close();
  });

  describe('1. Authentication & Session Lifecycles', () => {
    it('POST /api/v1/auth/login - should authenticate seeded root admin and issue session tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@communityos.io',
          password: 'Admin@CommunityOS2026!',
        })
        .expect(200);

      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@communityos.io');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.tokens.tokenType).toBe('Bearer');
      expect(res.body.data.sessionId).toBeDefined();

      adminAccessToken = res.body.data.tokens.accessToken;
      adminRefreshToken = res.body.data.tokens.refreshToken;
      adminSessionId = res.body.data.sessionId;
    });

    it('POST /api/v1/auth/login - should reject invalid credentials with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@communityos.io',
          password: 'WrongPassword2026!',
        })
        .expect(401);

      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('GET /api/v1/users - should reject unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users').expect(401);

      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('GET /api/v1/users - should accept valid Bearer token for Platform Admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/auth/sessions - should list active sessions for current user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      const current = res.body.data.find(
        (s: { id: string; isCurrent: boolean }) => s.id === adminSessionId,
      );
      expect(current).toBeDefined();
      expect(current.isCurrent).toBe(true);
    });

    it('POST /api/v1/auth/refresh - should rotate refresh token and issue new access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: adminRefreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(adminRefreshToken);

      // Update tokens for subsequent tests
      adminAccessToken = res.body.data.accessToken;
      adminRefreshToken = res.body.data.refreshToken;
    });

    it('DELETE /api/v1/auth/sessions/:sessionId - should revoke session and deny subsequent requests', async () => {
      // 1. Create a temporary secondary session
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@communityos.io',
          password: 'Admin@CommunityOS2026!',
        })
        .expect(200);

      const tempToken = loginRes.body.data.tokens.accessToken;
      const tempSessionId = loginRes.body.data.sessionId;

      // 2. Verify temporary session works
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(200);

      // 3. Revoke the temporary session
      await request(app.getHttpServer())
        .delete(`/api/v1/auth/sessions/${tempSessionId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      // 4. Verify that requests using revoked session token are immediately rejected with 401
      const failRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(401);

      expect(failRes.body.error.code).toBe('SESSION_REVOKED');
    });
  });

  describe('2. Scoped RBAC & Privilege Escalation Defense', () => {
    it('GET /api/v1/permissions - should return complete system permissions registry', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/permissions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(20);
      const permCodes = res.body.data.map((p: { code: string }) => p.code);
      expect(permCodes).toContain('organization.view');
      expect(permCodes).toContain('user.create');
      expect(permCodes).toContain('role.assign');
    });

    it('POST /api/v1/roles - should create a custom tenant role', async () => {
      const uniqueCode = `ROLE_${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: `Custom Role ${Date.now()}`,
          code: uniqueCode,
          description: 'Oversees community maintenance requests and equipment',
          scopeType: 'COMMUNITY',
          permissionCodes: ['community.view', 'user.view', 'session.view'],
        })
        .expect(201);

      expect(res.body.data.code).toBe(uniqueCode);
      expect(res.body.data.permissions.length).toBe(3);
      createdRoleId = res.body.data.id;
    });

    it('POST /api/v1/role-assignments - should block non-platform admin from assigning PLATFORM scope (Privilege Escalation Defense)', async () => {
      // 1. Authenticate as Org Admin
      const orgLoginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'orgadmin@communityos.io',
          password: 'Admin@CommunityOS2026!',
        })
        .expect(200);

      const orgAdminToken = orgLoginRes.body.data.tokens.accessToken;
      const orgAdminUser = orgLoginRes.body.data.user;

      // 2. Fetch platform admin role ID
      const rolesRes = await request(app.getHttpServer())
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const platformRole = rolesRes.body.data.find(
        (r: { code: string; id: string }) => r.code === 'PLATFORM_ADMIN',
      );

      // 3. Attempt privilege escalation: Org Admin trying to assign PLATFORM_ADMIN role
      const escalationRes = await request(app.getHttpServer())
        .post('/api/v1/role-assignments')
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          userId: orgAdminUser.id,
          roleId: platformRole.id,
          scopeType: 'PLATFORM',
        })
        .expect(403);

      expect(['PRIVILEGE_ESCALATION_DENIED', 'TENANT_ACCESS_DENIED']).toContain(
        escalationRes.body.error.code,
      );
    });
  });
});
