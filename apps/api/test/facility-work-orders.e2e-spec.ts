import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Enterprise Facility Management & Work Execution (Phase 9 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let categoryId: string;
  let checklistTemplateId: string;
  let maintenancePlanId: string;
  let workOrderId: string;
  let _taskId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  // ===========================================================================
  // 1. Facility Work Categories
  // ===========================================================================
  describe('1. Facility Work Categories', () => {
    it('POST /facility/categories - should create a facility work category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/facility/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          key: `cat_hvac_${testSuffix}`,
          name: `HVAC & Climate Control ${testSuffix}`,
          description: 'Air conditioning, chillers, and duct maintenance',
          defaultPriority: 'HIGH',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.key).toBe(`cat_hvac_${testSuffix}`);
      categoryId = res.body.data.id;
    });

    it('GET /facility/categories - should list categories for community', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/facility/categories?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect((res.body.data as Array<{ id: string }>).some((c) => c.id === categoryId)).toBe(true);
    });
  });

  // ===========================================================================
  // 2. Checklist Templates Catalog
  // ===========================================================================
  describe('2. Checklist Templates Catalog', () => {
    it('POST /facility/checklists - should create a versioned checklist template', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/facility/checklists')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          code: `CHK-HVAC-${testSuffix}`,
          name: `Chiller Inspection Checklist ${testSuffix}`,
          categoryId,
          status: 'PUBLISHED',
          items: [
            {
              id: 'item-refrigerant-pressure',
              label: 'Refrigerant Suction Pressure (PSI)',
              itemType: 'DECIMAL',
              isRequired: true,
              minValue: 50,
              maxValue: 90,
              unitLabel: 'PSI',
            },
            {
              id: 'item-compressor-audio',
              label: 'Compressor Noise Normal (PASS/FAIL)',
              itemType: 'PASS_FAIL',
              isRequired: true,
              failureRequiresComment: true,
            },
            {
              id: 'item-filter-cleaned',
              label: 'Primary Air Filter Cleaned',
              itemType: 'BOOLEAN',
              isRequired: true,
            },
          ],
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.code).toBe(`CHK-HVAC-${testSuffix}`);
      expect(res.body.data.version).toBe(1);
      checklistTemplateId = res.body.data.id;
    });

    it('GET /facility/checklists - should list checklist templates', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/facility/checklists?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(
        (res.body.data as Array<{ id: string }>).some((t) => t.id === checklistTemplateId),
      ).toBe(true);
    });
  });

  // ===========================================================================
  // 3. Preventive Maintenance Plans
  // ===========================================================================
  describe('3. Preventive Maintenance Plans', () => {
    it('POST /facility/maintenance-plans - should create an active recurring PM plan', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/facility/maintenance-plans')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          code: `PM-CHILLER-${testSuffix}`,
          name: `Monthly Central Chiller Servicing ${testSuffix}`,
          description: 'Monthly lubrication and compressor diagnostic',
          status: 'ACTIVE',
          workCategoryId: categoryId,
          scheduleType: 'MONTHLY',
          scheduleDefinition: { dayOfMonth: 1, timeOfDay: '08:00', interval: 1 },
          timezone: 'Asia/Kolkata',
          defaultPriority: 'NORMAL',
          checklistTemplateId,
          estimatedDurationMinutes: 180,
          generationPolicy: 'SKIP_MISSED',
          leadTimeDays: 2,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.code).toBe(`PM-CHILLER-${testSuffix}`);
      maintenancePlanId = res.body.data.id;
    });

    it('POST /facility/maintenance-plans/:id/preview - should preview upcoming occurrence schedule', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/facility/maintenance-plans/${maintenancePlanId}/preview`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ count: 5 })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(5);
    });

    it('POST /facility/maintenance-plans/:id/generate - should generate work order occurrence idempotently', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/facility/maintenance-plans/${maintenancePlanId}/generate`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ occurrenceDate: new Date('2026-11-01T08:00:00Z').toISOString() })
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });

  // ===========================================================================
  // 4. Work Orders Lifecycle & Field Execution
  // ===========================================================================
  describe('4. Work Orders Lifecycle & Field Execution', () => {
    it('POST /facility/work-orders - should create a corrective work order with checklist template', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/facility/work-orders')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId: communityId,
          title: `Chiller #1 Refrigerant Leak ${testSuffix}`,
          description: 'Emergency repair: high compressor temperature and suspected low pressure',
          workType: 'CORRECTIVE',
          priority: 'HIGH',
          categoryId,
          checklistTemplateId,
          tasks: [
            { title: 'Locate pressure gauge leak', sequence: 1, isRequired: true },
            { title: 'Braze copper fitting', sequence: 2, isRequired: true },
            { title: 'Top up R-134a refrigerant', sequence: 3, isRequired: true },
          ],
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.workOrderNumber).toMatch(/^WO-\d{4}-\d{6}$/);
      expect(res.body.data.currentState).toBe('DRAFT');
      workOrderId = res.body.data.id;
      _taskId = res.body.data.tasks[0].id;
    });

    it('POST /facility/work-orders/:id/claim - technician should self-claim work order', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/facility/work-orders/${workOrderId}/claim`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.currentState).toBe('ACCEPTED');
      expect(res.body.data.primaryAssigneeId).toBeDefined();
    });

    it('POST /facility/work-orders/:id/start - technician should start work', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/facility/work-orders/${workOrderId}/start`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.currentState).toBe('IN_PROGRESS');
      expect(res.body.data.actualStartAt).toBeDefined();
    });

    it('POST /facility/work-orders/:id/logs/timer/start - should start live labor timer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/facility/work-orders/${workOrderId}/logs/timer/start`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ type: 'WORK', notes: 'Troubleshooting chiller pressure' })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.startedAt).toBeDefined();
      expect(res.body.data.endedAt).toBeNull();
    });

    it('POST /facility/work-orders/:id/tasks/:taskId - should complete task steps', async () => {
      const woRes = await request(app.getHttpServer())
        .get(`/api/v1/facility/work-orders/${workOrderId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      for (const t of woRes.body.data.tasks) {
        await request(app.getHttpServer())
          .patch(`/api/v1/facility/work-orders/${workOrderId}/tasks/${t.id}`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({ status: 'COMPLETED', resultNotes: 'Verified OK' })
          .expect(200);
      }
    });

    it('POST /facility/work-orders/:id/checklists - should submit inspection items', async () => {
      const woRes = await request(app.getHttpServer())
        .get(`/api/v1/facility/work-orders/${workOrderId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      for (const c of woRes.body.data.checklistResults) {
        await request(app.getHttpServer())
          .post(`/api/v1/facility/work-orders/${workOrderId}/checklists`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            itemId: c.itemId,
            itemLabel: c.itemLabel,
            itemType: c.itemType,
            valueDecimal: 68.5,
            valueNumber: 68,
            isPassed: true,
            valueBoolean: true,
          })
          .expect(200);
      }
    });

    it('POST /facility/work-orders/:id/logs/timer/stop - should stop live labor timer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/facility/work-orders/${workOrderId}/logs/timer/stop`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ notes: 'Fittings brazed and leak tested' })
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.endedAt).toBeDefined();
      expect(res.body.data.durationMinutes).toBeGreaterThanOrEqual(1);
    });

    it('POST /facility/work-orders/:id/complete - should submit work order for supervisor review', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/facility/work-orders/${workOrderId}/complete`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          completionSummary:
            'Repaired brazed flare fitting, recharged 4.2kg R-134a refrigerant, suction pressure stable at 68 PSI.',
          resolutionCode: 'REPLACED_FITTING',
        })
        .expect(200);

      expect(res.body.data.currentState).toBe('SUPERVISOR_REVIEW');
    });

    it('POST /facility/work-orders/:id/supervisor-review - supervisor should approve and complete work order', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/facility/work-orders/${workOrderId}/supervisor-review`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          decision: 'APPROVED',
          reviewNotes: 'Inspected manifold gauges and operating current. Chiller cooling normally.',
        })
        .expect(200);

      expect(res.body.data.currentState).toBe('COMPLETED');
      expect(res.body.data.verifiedById).toBeDefined();
    });
  });

  // ===========================================================================
  // 5. Facility KPI Analytics
  // ===========================================================================
  describe('5. Facility KPI Analytics', () => {
    it('GET /facility/work-orders/analytics/kpi - should return real-time operational metrics', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/facility/work-orders/analytics/kpi?organizationId=${orgId}&communityId=${communityId}`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.totalOpen).toBe('number');
      expect(typeof res.body.data.preventiveCompliancePercentage).toBe('number');
    });
  });
});
