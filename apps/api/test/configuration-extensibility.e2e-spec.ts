import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';
import type {
  ConfigurationKeyDefinitionDto,
  FeatureDefinitionDto,
  EffectiveFeatureResponseDto,
  CustomFieldDefinitionResponseDto,
  CustomFieldValueResponseDto,
} from '@community-os/contracts';

describe('Configuration & Extensibility Engine (Phase 6 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let testUnitId: string;
  let createdCustomFieldDefId: string;

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

    // 1. Login as Root Admin
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

    const unit = await prisma.unit.findFirst({
      where: { communityId },
    });
    testUnitId = unit!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Typed Configuration Registry & Hierarchical Overrides', () => {
    it('GET /api/v1/configuration/registry - retrieves canonical configuration keys', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/configuration/registry')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(8);

      const sectionKey = (res.body.data.items as ConfigurationKeyDefinitionDto[]).find(
        (i) => i.key === 'community.display.sectionLabel',
      );
      expect(sectionKey).toBeDefined();
      expect(sectionKey?.defaultValue).toBe('Section');
      expect(sectionKey?.valueType).toBe('STRING');
    });

    it('GET /api/v1/configuration/effective - resolves default values when no override exists', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/configuration/effective?organizationId=${orgId}&communityId=${communityId}&keys=community.display.sectionLabel`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      const item = res.body.data.items[0];
      expect(item.key).toBe('community.display.sectionLabel');
      expect(item.resolvedFrom).toBe('DEFAULT');
      expect(item.isInherited).toBe(true);
      expect(item.value).toBe('Section');
    });

    it('PUT /api/v1/configuration/overrides - sets a scoped community override', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/configuration/overrides')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          key: 'community.display.sectionLabel',
          scopeType: 'COMMUNITY',
          scopeId: communityId,
          value: `Phase Sector ${testSuffix}`,
          changeReason: 'Community customized terminology',
        })
        .expect(200);

      expect(res.body.data.key).toBe('community.display.sectionLabel');
      expect(res.body.data.scopeType).toBe('COMMUNITY');
      expect(res.body.data.value).toBe(`Phase Sector ${testSuffix}`);
    });

    it('GET /api/v1/configuration/effective - confirms community override took precedence', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/configuration/effective?organizationId=${orgId}&communityId=${communityId}&keys=community.display.sectionLabel`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const item = res.body.data.items[0];
      expect(item.value).toBe(`Phase Sector ${testSuffix}`);
      expect(item.resolvedFrom).toBe('COMMUNITY');
      expect(item.isInherited).toBe(false);
    });

    it('GET /api/v1/terminology - resolves customized terminology endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/terminology?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.sectionLabel).toBe(`Phase Sector ${testSuffix}`);
      expect(res.body.data.buildingLabel).toBeDefined();
      expect(res.body.data.unitLabel).toBeDefined();
    });

    it('DELETE /api/v1/configuration/overrides - resets override back to inherited default', async () => {
      await request(app.getHttpServer())
        .delete(
          `/api/v1/configuration/overrides?key=community.display.sectionLabel&scopeType=COMMUNITY&scopeId=${communityId}`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      // Verify effective configuration reverted
      const effRes = await request(app.getHttpServer())
        .get(
          `/api/v1/configuration/effective?organizationId=${orgId}&communityId=${communityId}&keys=community.display.sectionLabel`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(effRes.body.data.items[0].value).toBe('Section');
      expect(effRes.body.data.items[0].isInherited).toBe(true);
    });
  });

  describe('2. Feature Flags & Entitlements', () => {
    it('GET /api/v1/features/definitions - lists available feature definitions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/features/definitions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.total).toBeGreaterThanOrEqual(5);
      const docFeat = (res.body.data.items as FeatureDefinitionDto[]).find(
        (f) => f.key === 'feature.documentLibrary',
      );
      expect(docFeat).toBeDefined();
      expect(docFeat?.defaultEnabled).toBe(true);
    });

    it('GET /api/v1/features/effective - resolves active features for tenant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/features/effective?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items).toBeInstanceOf(Array);
      const feat = (res.body.data.items as EffectiveFeatureResponseDto[]).find(
        (f) => f.key === 'feature.documentLibrary',
      );
      expect(feat?.enabled).toBe(true);
    });

    it('PUT /api/v1/features/overrides - overrides a feature flag toggle at community scope', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/features/overrides')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          featureKey: 'feature.documentLibrary',
          scopeType: 'COMMUNITY',
          scopeId: communityId,
          enabled: false,
          reason: 'Temporarily disabled in test community',
        })
        .expect(200);

      expect(res.body.data.enabled).toBe(false);

      // Verify effective feature is now disabled
      const effRes = await request(app.getHttpServer())
        .get(`/api/v1/features/effective?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const feat = (effRes.body.data.items as EffectiveFeatureResponseDto[]).find(
        (f) => f.key === 'feature.documentLibrary',
      );
      expect(feat?.enabled).toBe(false);
      expect(feat?.resolvedFrom).toBe('COMMUNITY');
    });

    it('DELETE /api/v1/features/overrides - resets feature override back to default', async () => {
      await request(app.getHttpServer())
        .delete(
          `/api/v1/features/overrides?featureKey=feature.documentLibrary&scopeType=COMMUNITY&scopeId=${communityId}`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const effRes = await request(app.getHttpServer())
        .get(`/api/v1/features/effective?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const feat = (effRes.body.data.items as EffectiveFeatureResponseDto[]).find(
        (f) => f.key === 'feature.documentLibrary',
      );
      expect(feat?.enabled).toBe(true);
      expect(feat?.resolvedFrom).toBe('DEFAULT');
    });
  });

  describe('3. Custom Fields & Dynamic Metadata', () => {
    it('POST /api/v1/custom-fields/definitions - creates a custom field definition for UNIT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/custom-fields/definitions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          entityType: 'UNIT',
          key: `parkingBay_${testSuffix}`,
          label: `Parking Bay ${testSuffix}`,
          description: 'Assigned basement parking bay number',
          fieldType: 'TEXT',
          required: false,
          searchable: true,
          visibility: 'TENANT_INTERNAL',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.key).toBe(`parkingBay_${testSuffix}`);
      expect(res.body.data.fieldType).toBe('TEXT');
      createdCustomFieldDefId = res.body.data.id;
    });

    it('GET /api/v1/custom-fields/definitions - lists definitions for tenant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/custom-fields/definitions?organizationId=${orgId}&entityType=UNIT`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(
        (res.body.data.items as CustomFieldDefinitionResponseDto[]).some(
          (i) => i.id === createdCustomFieldDefId,
        ),
      ).toBe(true);
    });

    it('PUT /api/v1/custom-fields/values/UNIT/:id - sets custom field value on unit instance', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/custom-fields/values/UNIT/${testUnitId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          values: [
            {
              definitionId: createdCustomFieldDefId,
              value: `BAY-B1-${testSuffix}`,
            },
          ],
        })
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].value).toBe(`BAY-B1-${testSuffix}`);
    });

    it('GET /api/v1/custom-fields/values/UNIT/:id - retrieves custom field values and definitions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/custom-fields/values/UNIT/${testUnitId}?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.definitions).toBeInstanceOf(Array);
      expect(res.body.data.values).toBeInstanceOf(Array);
      const valItem = (res.body.data.values as CustomFieldValueResponseDto[]).find(
        (v) => v.definitionId === createdCustomFieldDefId,
      );
      expect(valItem).toBeDefined();
      expect(valItem?.value).toBe(`BAY-B1-${testSuffix}`);
    });

    it('POST /api/v1/custom-fields/definitions/:id/archive - archives custom field definition', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/custom-fields/definitions/${createdCustomFieldDefId}/archive`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('ARCHIVED');
    });
  });
});
