import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Multi-Tenancy & Platform Core Isolation Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let orgAId: string;
  let orgBId: string;
  let commAId: string;
  let commBId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up created test entities
    if (orgAId) {
      await prisma.organization.delete({ where: { id: orgAId } }).catch(() => {});
    }
    if (orgBId) {
      await prisma.organization.delete({ where: { id: orgBId } }).catch(() => {});
    }
    await app.close();
  });

  it('1. Should provision Organization A and Organization B', async () => {
    const resA = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .send({
        name: 'Enterprise Org Alpha',
        slug: `org-alpha-${Date.now()}`,
        defaultCurrency: 'USD',
        defaultTimezone: 'UTC',
      })
      .expect(201);

    expect(resA.body.data).toHaveProperty('id');
    orgAId = resA.body.data.id;

    const resB = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .send({
        name: 'Enterprise Org Beta',
        slug: `org-beta-${Date.now()}`,
        defaultCurrency: 'INR',
        defaultTimezone: 'Asia/Kolkata',
      })
      .expect(201);

    expect(resB.body.data).toHaveProperty('id');
    orgBId = resB.body.data.id;
  });

  it('2. Should provision Community A1 under Org A and Community B1 under Org B', async () => {
    const resA = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/communities`)
      .send({
        name: 'Alpha Heights',
        code: 'ALPHA-01',
        slug: 'alpha-heights',
        address: {
          addressLine1: '100 Alpha Way',
          city: 'San Francisco',
          postalCode: '94105',
          countryCode: 'US',
        },
      })
      .expect(201);

    commAId = resA.body.data.id;
    expect(resA.body.data.organizationId).toBe(orgAId);

    const resB = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgBId}/communities`)
      .send({
        name: 'Beta Meadows',
        code: 'BETA-01',
        slug: 'beta-meadows',
        address: {
          addressLine1: '200 Beta Road',
          city: 'Bengaluru',
          postalCode: '560001',
          countryCode: 'IN',
        },
      })
      .expect(201);

    commBId = resB.body.data.id;
    expect(resB.body.data.organizationId).toBe(orgBId);
  });

  it('3. [SECURITY] Org A cannot access or list communities belonging to Org B', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/organizations/${orgAId}/communities`)
      .set('x-organization-id', orgAId)
      .expect(200);

    const communityIds = res.body.data.map((c: { id: string }) => c.id);
    expect(communityIds).toContain(commAId);
    expect(communityIds).not.toContain(commBId);
  });

  it('4. [SECURITY] Querying Community B with Org A tenant context must strictly fail (404/403)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/communities/${commBId}`)
      .set('x-organization-id', orgAId)
      .expect(404);

    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('COMMUNITY_NOT_FOUND');
  });

  it('5. [CONSTRAINT] Scoped Uniqueness: Duplicate community code in SAME org fails with 409', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/communities`)
      .send({
        name: 'Conflicting Code Community',
        code: 'ALPHA-01', // Already exists in Org A
        slug: 'conflicting-slug',
        address: {
          addressLine1: '300 Another Way',
          city: 'San Francisco',
          postalCode: '94105',
          countryCode: 'US',
        },
      })
      .expect(409);

    expect(res.body.error.code).toBe('DUPLICATE_COMMUNITY_CODE');
  });

  it('6. [CONSTRAINT] Scoped Uniqueness: Same community code in DIFFERENT org succeeds (201)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgBId}/communities`)
      .send({
        name: 'Alpha in Org B',
        code: 'ALPHA-01', // Same code as in Org A, but under Org B
        slug: 'alpha-in-org-b',
        address: {
          addressLine1: '400 Different St',
          city: 'Bengaluru',
          postalCode: '560001',
          countryCode: 'IN',
        },
      })
      .expect(201);

    expect(res.body.data.code).toBe('ALPHA-01');
    expect(res.body.data.organizationId).toBe(orgBId);
  });

  it('7. [CONCURRENCY] Optimistic concurrency locking rejects update with stale expectedVersion', async () => {
    // 1st update increments version from 1 to 2
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgAId}`)
      .send({
        name: 'Enterprise Org Alpha Updated',
        expectedVersion: 1,
      })
      .expect(200);

    // 2nd update providing stale version 1 must return 409 CONCURRENCY_CONFLICT
    const conflictRes = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgAId}`)
      .send({
        name: 'Enterprise Org Alpha Stale Update',
        expectedVersion: 1,
      })
      .expect(409);

    expect(conflictRes.body.error.code).toBe('CONCURRENCY_CONFLICT');
  });

  it('8. [LIFECYCLE] Status transition: ARCHIVED is terminal and cannot transition to ACTIVE', async () => {
    // Archive Organization B
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgBId}/status`)
      .send({
        status: 'ARCHIVED',
      })
      .expect(200);

    // Attempt invalid transition back to ACTIVE
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgBId}/status`)
      .send({
        status: 'ACTIVE',
      })
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});
