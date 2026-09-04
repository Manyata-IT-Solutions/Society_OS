import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Enterprise Asset Management (Phase 10 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let categoryId: string;
  let modelId: string;
  let assetId: string;
  let assetQrToken: string;
  let meterId: string;
  let contractId: string;

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

    // 1. Login as Platform Admin
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

    // Ensure fallback category and asset if needed
    const defaultCat = await prisma.assetCategory.findFirst({
      where: { organizationId: orgId },
    });
    if (defaultCat) {
      categoryId = defaultCat.id;
    }

    const defaultAsset = await prisma.asset.findFirst({
      where: { organizationId: orgId },
    });
    if (defaultAsset) {
      assetId = defaultAsset.id;
      assetQrToken = defaultAsset.qrIdentifier;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // ===========================================================================
  // 1. Asset Categories
  // ===========================================================================
  describe('1. Asset Category Management', () => {
    it('POST /asset-categories - should create a physical asset category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/asset-categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          code: `HVAC_${testSuffix}`,
          name: `HVAC Systems ${testSuffix}`,
          description: 'Heating, ventilation, and air conditioning equipment',
          defaultCriticality: 'HIGH',
          defaultExpectedLifeYears: 12,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.code).toBe(`HVAC_${testSuffix}`);
      categoryId = res.body.data.id;
    });

    it('GET /asset-categories - should list categories', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/asset-categories?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c: any) => c.id === categoryId)).toBe(true);
    });
  });

  // ===========================================================================
  // 2. Asset Models Master
  // ===========================================================================
  describe('2. Asset Model Master Catalog', () => {
    it('POST /asset-models - should register an asset model specification', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/asset-models')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          categoryId: categoryId,
          modelName: `Daikin Chiller 100TR ${testSuffix}`,
          manufacturer: `Daikin Industries ${testSuffix}`,
          modelNumber: `WSC-100-${testSuffix}`,
          description: 'Centrifugal water chiller unit with R134a refrigerant',
          specifications: {
            coolingTR: 100,
            voltage: '415V',
          },
          expectedLifeYears: 15,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.manufacturer).toBe(`Daikin Industries ${testSuffix}`);
      modelId = res.body.data.id;
    });
  });

  // ===========================================================================
  // 3. Physical Asset Registry & Lifecycle
  // ===========================================================================
  describe('3. Physical Asset Registration & Lifecycle State Transitions', () => {
    it('POST /assets - should create an asset with auto sequence code & opaque QR', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          name: `Main Centrifugal Chiller 01 ${testSuffix}`,
          description: 'Primary central cooling chiller for Clubhouse and Tower A',
          assetCategoryId: categoryId,
          assetModelId: modelId,
          manufacturer: 'Daikin Industries',
          modelNumber: `WSC-100-${testSuffix}`,
          serialNumber: `DKN-${testSuffix}-9982`,
          criticality: 'CRITICAL',
          condition: 'GOOD',
          locationType: 'COMMUNITY',
          locationDescription: 'Rooftop HVAC Plant Deck',
          expectedLifeYears: 15,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.assetCode).toMatch(/^AST-.*-\d{4}-\d{6}$/);
      expect(res.body.data.qrIdentifier).toMatch(/^ast_qr_[a-f0-9]+$/);
      expect(res.body.data.lifecycleState).toBe('REGISTERED');
      expect(res.body.data.operationalStatus).toBe('OPERATIONAL');

      assetId = res.body.data.id;
      assetQrToken = res.body.data.qrIdentifier;
    });

    it('GET /assets/:id - should return asset details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/assets/${assetId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(assetId);
      expect(res.body.data.categoryName).toBeDefined();
    });

    it('POST /assets/:id/commission - should commission asset into active service', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${assetId}/commission`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ commissioningNotes: 'Site load testing and vibration analysis passed.' })
        .expect(200);

      expect(res.body.data.lifecycleState).toBe('ACTIVE');
      expect(res.body.data.commissionedAt).toBeDefined();
    });

    it('POST /assets/:id/breakdown - should report breakdown and set OUT_OF_SERVICE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${assetId}/breakdown`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reason: 'BREAKDOWN',
          impactLevel: 'FULL_OUTAGE',
          notes: 'High pressure alarm trip on compressor 1',
        })
        .expect(200);

      expect(res.body.data.operationalStatus).toBe('OUT_OF_SERVICE');
    });

    it('POST /assets/:id/restore - should restore OPERATIONAL status', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${assetId}/restore`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ notes: 'Refrigerant pressure sensor recalibrated.' })
        .expect(200);

      expect(res.body.data.operationalStatus).toBe('OPERATIONAL');
    });

    it('POST /assets/:id/move - should move asset and record location history', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/assets/${assetId}/move`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          toLocationType: 'COMMUNITY',
          toLocationDescription: 'Central Energy Plant Deck Bay 2',
          reason: 'Permanent facility reorganization',
        })
        .expect(200);

      expect(res.body.data.locationDescription).toBe('Central Energy Plant Deck Bay 2');

      const histRes = await request(app.getHttpServer())
        .get(`/api/v1/assets/${assetId}/location-history`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(histRes.body.data.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 4. Opaque QR Code & Barcode Resolution
  // ===========================================================================
  describe('4. Opaque QR Code Identifier Resolution', () => {
    it('GET /assets/scan/:identifier - should resolve asset via opaque QR token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/assets/scan/${assetQrToken}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.asset).toBeDefined();
      expect(res.body.data.asset.id).toBe(assetId);
      expect(res.body.data.asset.assetCode).toBeDefined();
    });
  });

  // ===========================================================================
  // 5. Meters & Monotonic Readings
  // ===========================================================================
  describe('5. Asset Meters & Telemetry Counters', () => {
    it('POST /asset-meters - should create a cumulative run-hour meter', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/asset-meters')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          assetId: assetId,
          name: `Operating Run Hours ${testSuffix}`,
          meterType: 'RUN_HOURS',
          unit: 'hrs',
          initialReading: 500.0,
          allowsReset: false,
        })
        .expect(201);

      expect(res.body.data.currentReading).toBe(500);
      meterId = res.body.data.id;
    });

    it('POST /asset-meters/:id/readings - should record monotonic reading and calculate delta', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/asset-meters/${meterId}/readings`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reading: 524.5,
          notes: 'Weekly preventive check reading',
        })
        .expect(201);

      expect(res.body.data.reading).toBe(524.5);
      expect(res.body.data.delta).toBe(24.5);
    });

    it('POST /asset-meters/:id/readings - should reject decreasing reading (counter regression)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/asset-meters/${meterId}/readings`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reading: 400.0,
          notes: 'Invalid decreasing reading',
        })
        .expect(400);
    });
  });

  // ===========================================================================
  // 6. Warranties & AMC Contracts
  // ===========================================================================
  describe('6. Warranties and AMC Service Contract Links', () => {
    it('POST /asset-warranties - should attach OEM warranty', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/asset-warranties')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          assetId: assetId,
          warrantyType: 'MANUFACTURER',
          providerName: 'Daikin Airconditioning India',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2028-01-01').toISOString(),
          coverageSummary:
            'Comprehensive 36-month compressor & electronic expansion valve warranty',
        })
        .expect(201);

      expect(res.body.data.providerName).toBe('Daikin Airconditioning India');
    });

    it('POST /asset-contracts - should create AMC service contract with SLA terms', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/asset-contracts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          contractNumber: `AMC-DKN-${testSuffix}`,
          name: `Comprehensive Chiller AMC ${testSuffix}`,
          serviceProviderName: 'Daikin Authorized Service Partner',
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2026-12-31').toISOString(),
          contractType: 'CMC',
          coverageSummary: '24/7 emergency response and quarterly major servicing',
          preventiveVisitsPerYear: 4,
          slaResponseHours: 2,
        })
        .expect(201);

      expect(res.body.data.contractNumber).toBe(`AMC-DKN-${testSuffix}`);
      contractId = res.body.data.id;
    });

    it('POST /asset-contracts/:id/link-assets - should link asset to AMC contract', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/asset-contracts/${contractId}/link-assets`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ assetIds: [assetId], notes: 'Primary chiller unit coverage' })
        .expect(200);

      expect(res.body.data.success).toBe(true);
    });
  });

  // ===========================================================================
  // 7. Bulk CSV Import Engine
  // ===========================================================================
  describe('7. Bulk CSV Asset Import Engine', () => {
    it('POST /assets/import/preview & execute - should preview and batch onboard assets', async () => {
      const csv = `name,categoryCode,manufacturer,modelNumber,serialNumber,criticality,locationType,locationDescription
Bulk Water Pump 01,ELEC,Kirloskar,KP-50,KIR-${testSuffix}-01,HIGH,COMMUNITY,Main Pump Room
Bulk Fire Booster 02,ELEC,Grundfos,GF-90,GRN-${testSuffix}-02,CRITICAL,COMMUNITY,Fire Sump Bay`;

      const prevRes = await request(app.getHttpServer())
        .post(`/api/v1/assets/import/preview?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          csvContent: csv,
        })
        .expect(200);

      expect(prevRes.body.data.validCount).toBe(2);

      const execRes = await request(app.getHttpServer())
        .post(`/api/v1/assets/import/execute?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          fileName: 'bulk-assets.csv',
          csvContent: csv,
        })
        .expect(201);

      expect(execRes.body.data.successfulRows).toBe(2);
    });
  });
});
