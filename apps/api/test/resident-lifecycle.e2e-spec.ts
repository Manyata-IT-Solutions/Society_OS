import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Household, Resident & Occupancy Lifecycle (Phase 4 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let testUnit1: string;
  let testUnit2: string;
  let resident1Id: string;
  let resident2Id: string;
  let occupancy1Id: string;

  const testSuffix = Date.now().toString().slice(-6);

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

    // Login as root platform admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@communityos.io',
        password: 'Admin@CommunityOS2026!',
      })
      .expect(200);

    adminAccessToken = loginRes.body.data.tokens.accessToken;

    const org = await prisma.organization.findFirst({
      where: { slug: 'community-os-demo' },
    });
    orgId = org!.id;

    const comm = await prisma.community.findFirst({
      where: { organizationId: orgId, slug: 'green-valley-township' },
    });
    communityId = comm!.id;

    // Create 2 unique test units for this test run
    const u1 = await prisma.unit.create({
      data: {
        organizationId: orgId,
        communityId,
        unitNumber: `E4-${testSuffix}-1`,
        displayName: `Unit E4-1-${testSuffix}`,
        unitType: 'APARTMENT',
        status: 'ACTIVE',
        version: 1,
      },
    });
    testUnit1 = u1.id;

    const u2 = await prisma.unit.create({
      data: {
        organizationId: orgId,
        communityId,
        unitNumber: `E4-${testSuffix}-2`,
        displayName: `Unit E4-2-${testSuffix}`,
        unitType: 'APARTMENT',
        status: 'ACTIVE',
        version: 1,
      },
    });
    testUnit2 = u2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Resident Master & Profile Decoupling', () => {
    it('should create a resident profile without a linked User account', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/residents`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          firstName: 'Robert',
          lastName: `Frost-${testSuffix}`,
          email: `robert.frost.${testSuffix}@example.com`,
          phone: `+1202555${testSuffix.slice(-4)}`,
          gender: 'MALE',
          status: 'ACTIVE',
          preferredLanguage: 'en',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.firstName).toBe('Robert');
      expect(res.body.data.userId).toBeNull();
      resident1Id = res.body.data.id;
    });

    it('should prevent duplicate resident by email within same community', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/residents`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          firstName: 'Duplicate',
          lastName: 'Person',
          email: `robert.frost.${testSuffix}@example.com`,
          status: 'ACTIVE',
        })
        .expect(409);
    });

    it('should invite resident and provision User authentication account', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/residents/${resident1Id}/invite`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(`robert.frost.${testSuffix}@example.com`);
      expect(res.body.data.resident.userId).toBe(res.body.data.user.id);
    });
  });

  describe('2. Transactional Move-In & Occupancy Engine', () => {
    it('should execute owner-occupied transactional move-in', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/units/${testUnit1}/move-in`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          unitId: testUnit1,
          occupancyType: 'OWNER_OCCUPIED',
          effectiveDate: '2026-09-01',
          householdName: 'Frost Household',
          primaryResident: {
            residentId: resident1Id,
            relationshipType: 'SELF',
          },
          isNewOwner: true,
          ownershipShare: 100.0,
          ownershipType: 'SOLE',
          sendAppInvitations: false,
        })
        .expect(201);

      expect(res.body.data.household).toBeDefined();
      expect(res.body.data.occupancy).toBeDefined();
      expect(res.body.data.occupancy.status).toBe('ACTIVE');
      expect(res.body.data.ownership).toBeDefined();
      expect(res.body.data.ownership.residentId).toBe(resident1Id);
      occupancy1Id = res.body.data.occupancy.id;
    });

    it('should prevent overlapping active occupancies on the same unit', async () => {
      // Attempt another move-in on testUnit1 which is already occupied
      await request(app.getHttpServer())
        .post(`/api/v1/units/${testUnit1}/move-in`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          unitId: testUnit1,
          occupancyType: 'TENANT_OCCUPIED',
          effectiveDate: '2026-09-05',
          primaryResident: {
            firstName: 'Conflicting',
            lastName: 'Tenant',
            email: `conflict.${testSuffix}@example.com`,
          },
        })
        .expect(409);
    });

    it('should execute rental move-in with tenancy on second unit', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/units/${testUnit2}/move-in`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          unitId: testUnit2,
          occupancyType: 'TENANT_OCCUPIED',
          effectiveDate: '2026-09-01',
          leaseEndDate: '2027-08-31',
          agreementReference: `LEASE-${testSuffix}`,
          primaryResident: {
            firstName: 'Sarah',
            lastName: `Connor-${testSuffix}`,
            email: `sarah.connor.${testSuffix}@example.com`,
            phone: `+12025559${testSuffix.slice(-3)}`,
          },
          additionalMembers: [
            {
              firstName: 'John',
              lastName: `Connor-${testSuffix}`,
              relationshipType: 'CHILD',
            },
          ],
        })
        .expect(201);

      expect(res.body.data.household).toBeDefined();
      expect(res.body.data.occupancy.occupancyType).toBe('TENANT_OCCUPIED');
      expect(res.body.data.tenancy).toBeDefined();
      expect(res.body.data.tenancy.agreementReference).toBe(`LEASE-${testSuffix}`);
      expect(res.body.data.members.length).toBe(2);
      resident2Id = res.body.data.primaryResident.id;
    });
  });

  describe('3. Unit Residential State Aggregation', () => {
    it('should return full residential snapshot with current and historical state', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/units/${testUnit1}/residential-state`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.unitId).toBe(testUnit1);
      expect(res.body.data.isOccupied).toBe(true);
      expect(res.body.data.currentOccupancy).toBeDefined();
      expect(res.body.data.currentOwners.length).toBe(1);
      expect(res.body.data.currentOwners[0].residentId).toBe(resident1Id);
    });
  });

  describe('4. Property Title & Ownership Transfer', () => {
    it('should transfer ownership to incoming owner and terminate previous ownership record', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/units/${testUnit1}/ownership/transfer`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          transferDate: '2026-09-02',
          newOwners: [
            {
              residentId: resident2Id,
              ownershipShare: 100.0,
              ownershipType: 'SOLE',
              isPrimaryOwner: true,
            },
          ],
        })
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0].residentId).toBe(resident2Id);

      // Verify previous ownership is now TRANSFERRED
      const prevOwnership = await prisma.unitOwnership.findFirst({
        where: { unitId: testUnit1, residentId: resident1Id },
      });
      expect(prevOwnership?.status).toBe('TRANSFERRED');
      expect(prevOwnership?.endDate).toBeDefined();
    });
  });

  describe('5. Transactional Move-Out Engine', () => {
    it('should end occupancy and deactivate household on move-out', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/occupancies/${occupancy1Id}/move-out`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          effectiveDate: '2026-09-02',
          reason: 'Relocated to another city',
        })
        .expect(200);

      expect(res.body.data.id).toBe(occupancy1Id);
      expect(res.body.data.status).toBe('ENDED');

      // Unit should now be unoccupied
      const stateRes = await request(app.getHttpServer())
        .get(`/api/v1/units/${testUnit1}/residential-state`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(stateRes.body.data.isOccupied).toBe(false);
      expect(stateRes.body.data.currentOccupancy).toBeNull();
    });
  });

  describe('6. CSV Batch Validation & Import Pipeline', () => {
    it('should validate CSV rows and preview data', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/resident-import/validate`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rows: [
            {
              unitNumber: `E4-${testSuffix}-1`,
              firstName: 'Imported',
              lastName: `Owner-${testSuffix}`,
              email: `imported.owner.${testSuffix}@example.com`,
              phone: `+12025558${testSuffix.slice(-3)}`,
              roleInUnit: 'OWNER',
            },
          ],
        })
        .expect(200);

      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.totalRows).toBe(1);
    });

    it('should commit CSV import and onboard residents', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/resident-import/commit`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          sourceFileName: 'batch-residents.csv',
          rows: [
            {
              unitNumber: `E4-${testSuffix}-1`,
              firstName: 'Imported',
              lastName: `Owner-${testSuffix}`,
              email: `imported.owner.${testSuffix}@example.com`,
              phone: `+12025558${testSuffix.slice(-3)}`,
              roleInUnit: 'OWNER',
            },
          ],
        })
        .expect(201);

      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.successRows).toBe(1);
    });
  });
});
