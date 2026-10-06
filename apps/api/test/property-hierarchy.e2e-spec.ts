import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Property Hierarchy & Residential Master (Phase 3 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let _portfolioId: string;
  let sectionId: string;
  let buildingId: string;
  let floorId: string;
  let unitId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Enterprise Portfolio Management', () => {
    it('POST /api/v1/organizations/:orgId/portfolios - should create a new regional portfolio', async () => {
      const code = `PORT-${testSuffix}`;
      const res = await request(app.getHttpServer())
        .post(`/api/v1/organizations/${orgId}/portfolios`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: `North Region Residential Portfolio ${testSuffix}`,
          code,
          description: 'Portfolio for testing Phase 3 hierarchy',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('ACTIVE');
      _portfolioId = res.body.data.id;
    });

    it('GET /api/v1/organizations/:orgId/portfolios - should list portfolios for organization', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/organizations/${orgId}/portfolios`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Community Sections & Clusters', () => {
    it('POST /api/v1/communities/:commId/sections - should create a community section', async () => {
      const code = `SEC-${testSuffix}`;
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/sections`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: `Greenwood Enclave ${testSuffix}`,
          code,
          description: 'Phase 2 residential section',
          sortOrder: 2,
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.code).toBe(code);
      sectionId = res.body.data.id;
    });

    it('GET /api/v1/communities/:commId/sections - should list sections', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/communities/${communityId}/sections`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Building & Tower Master', () => {
    it('POST /api/v1/communities/:commId/buildings - should create a building linked to a section', async () => {
      const code = `BLD-${testSuffix}`;
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/buildings`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: `Tower Cedar ${testSuffix}`,
          code,
          buildingType: 'TOWER',
          sectionId,
          numberOfFloors: 12,
          sortOrder: 3,
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.sectionId).toBe(sectionId);
      buildingId = res.body.data.id;
    });

    it('GET /api/v1/communities/:commId/buildings - should list buildings with section details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/communities/${communityId}/buildings`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Floors Master & Duplicate Label Guard', () => {
    it('POST /api/v1/buildings/:bldgId/floors - should create floor in building', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/buildings/${buildingId}/floors`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          label: '1',
          levelNumber: 1,
          sortOrder: 1,
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.label).toBe('1');
      floorId = res.body.data.id;
    });

    it('POST /api/v1/buildings/:bldgId/floors - should reject duplicate floor label in same building with 409', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/buildings/${buildingId}/floors`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          label: '1',
          levelNumber: 1,
          sortOrder: 1,
        })
        .expect(409);

      expect(res.body.error.code).toBe('DUPLICATE_ENTITY');
    });
  });

  describe('5. Unit Master & Ancestry Path', () => {
    it('POST /api/v1/communities/:commId/units - should create unit under building and floor', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/units`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          buildingId,
          floorId,
          sectionId,
          unitNumber: `101`,
          displayName: `Unit 101 (3BHK)`,
          unitType: 'APARTMENT',
          carpetArea: 1400,
          areaUnit: 'SQFT',
          bedroomCount: 3,
          bathroomCount: 2,
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.unitNumber).toBe('101');
      expect(res.body.data.path).toContain('Tower Cedar');
      unitId = res.body.data.id;
    });

    it('POST /api/v1/communities/:commId/units - should reject duplicate unit number within same building', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/units`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          buildingId,
          floorId,
          unitNumber: '101',
        })
        .expect(409);

      expect(res.body.error.code).toBe('DUPLICATE_ENTITY');
    });

    it('GET /api/v1/units/:unitId - should fetch unit with calculated path', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/units/${unitId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(unitId);
      expect(res.body.data.path).toBeDefined();
    });
  });

  describe('6. Property Hierarchy Tree Explorer API', () => {
    it('GET /api/v1/communities/:commId/property-tree - should return complete structured tree', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/communities/${communityId}/property-tree`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.root).toBeDefined();
      expect(res.body.data.root.id).toBe(communityId);
      expect(res.body.data.root.type).toBe('COMMUNITY');
      expect(res.body.data.root.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('7. Bulk Unit Generator', () => {
    it('POST /api/v1/communities/:commId/units/bulk - should generate multiple units across floors', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/units/bulk`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          buildingId,
          floors: [
            { floorLabel: '2', levelNumber: 2 },
            { floorLabel: '3', levelNumber: 3 },
          ],
          unitSuffixes: ['01', '02'],
          unitType: 'APARTMENT',
          carpetArea: 1250,
          areaUnit: 'SQFT',
        })
        .expect(201);

      expect(res.body.data.totalGenerated).toBe(4);
      expect(res.body.data.createdUnits.length).toBe(4);
    });
  });

  describe('8. CSV Import Validation and Batch Commit', () => {
    it('POST /api/v1/communities/:commId/property-import/validate - should preview and validate CSV rows', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/property-import/validate`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rows: [
            { unitNumber: '401', buildingCode: `IMP-${testSuffix}`, floorLabel: '4' },
            { unitNumber: '402', buildingCode: `IMP-${testSuffix}`, floorLabel: '4' },
          ],
        })
        .expect(200);

      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.totalRows).toBe(2);
      expect(res.body.data.validRowsCount).toBe(2);
    });

    it('POST /api/v1/communities/:commId/property-import/commit - should transactionally create imported buildings and units', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/communities/${communityId}/property-import/commit`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          sourceFileName: 'test-import.csv',
          rows: [
            {
              unitNumber: '401',
              buildingCode: `IMP-${testSuffix}`,
              buildingName: `Import Tower ${testSuffix}`,
              floorLabel: '4',
              carpetArea: 1100,
            },
            {
              unitNumber: '402',
              buildingCode: `IMP-${testSuffix}`,
              buildingName: `Import Tower ${testSuffix}`,
              floorLabel: '4',
              carpetArea: 1100,
            },
          ],
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.successRows).toBe(2);
    });
  });

  describe('9. Sanitized CSV Export', () => {
    it('GET /api/v1/communities/:commId/units/export - should export authorized units to CSV', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/communities/${communityId}/units/export`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Unit Number');
      expect(res.text).toContain('101');
    });
  });

  describe('10. Scoped Security & Cross-Tenant Isolation', () => {
    it('should reject unauthenticated access to property hierarchy with 401', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/communities/${communityId}/property-tree`)
        .expect(401);
    });
  });
});
