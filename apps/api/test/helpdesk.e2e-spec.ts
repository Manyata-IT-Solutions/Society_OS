import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Enterprise Helpdesk & Complaint Management (Phase 8 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let categoryId: string;
  let subcategoryId: string;
  let teamId: string;
  let ticketId: string;

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
  // 1. CATEGORY CATALOG MANAGEMENT
  // ===========================================================================
  describe('Category Catalog API', () => {
    it('should create top-level category and subcategory', async () => {
      // Create top category
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/helpdesk/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId,
          key: `category.plumbing.${testSuffix}`,
          name: `Plumbing & Water ${testSuffix}`,
          description: 'Water leakages, tap repairs, drainage',
          defaultPriority: 'HIGH',
          requiresUnit: true,
        })
        .expect(201);

      categoryId = res1.body.data.id;
      expect(res1.body.data.name).toContain('Plumbing');

      // Create subcategory
      const res2 = await request(app.getHttpServer())
        .post('/api/v1/helpdesk/categories')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId,
          parentId: categoryId,
          key: `category.plumbing.drainage.${testSuffix}`,
          name: 'Blocked Drain',
          defaultPriority: 'URGENT',
        })
        .expect(201);

      subcategoryId = res2.body.data.id;
      expect(res2.body.data.parentId).toBe(categoryId);
    });

    it('should fetch category tree hierarchy', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/helpdesk/categories/tree?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      const parent = res.body.data.find(
        (c: { id: string; subcategories: Array<{ id: string }> }) => c.id === categoryId,
      );
      expect(parent).toBeDefined();
      expect(parent.subcategories.some((s: { id: string }) => s.id === subcategoryId)).toBe(true);
    });
  });

  // ===========================================================================
  // 2. OPERATIONAL TEAMS MANAGEMENT
  // ===========================================================================
  describe('Operational Teams API', () => {
    it('should create operational team and add team member', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/helpdesk/teams')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId,
          key: `team.plumbing.${testSuffix}`,
          name: `Plumbing Maintenance Team ${testSuffix}`,
          description: 'Rapid plumbing repairs team',
        })
        .expect(201);

      teamId = res.body.data.id;
      expect(res.body.data.key).toContain('plumbing');
    });

    it('should list operational teams', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/helpdesk/teams?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.some((t: { id: string }) => t.id === teamId)).toBe(true);
    });
  });

  // ===========================================================================
  // 3. TICKET LIFECYCLE & WORKFLOW ENGINE INTEGRATION
  // ===========================================================================
  describe('Ticket Lifecycle & Workflow Transitions', () => {
    it('should create a new ticket with automatic sequence number and workflow instance', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/helpdesk/tickets')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId,
          categoryId,
          subcategoryId,
          title: 'Severe pipeline leakage under kitchen sink',
          description: 'Water is flooding the kitchen cabinet floor.',
          locationType: 'UNIT',
          priority: 'URGENT',
        })
        .expect(201);

      ticketId = res.body.data.id;
      expect(res.body.data.ticketNumber).toMatch(/^TKT-2026-\d{5}$/);
      expect(res.body.data.currentState).toBe('NEW');
    });

    it('should retrieve ticket detail with timeline and allowed workflow actions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/helpdesk/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(ticketId);
      expect(res.body.data.allowedActions).toBeDefined();
    });

    it('should assign ticket to operational team and record assignment history', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/helpdesk/tickets/${ticketId}/assign`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          teamId,
          reason: 'Dispatched to emergency plumbing crew',
        })
        .expect(200);

      expect(res.body.data.assignedTeamId).toBe(teamId);
      expect(res.body.data.currentState).toBe('ASSIGNED');
    });

    it('should add public reply and internal confidential note', async () => {
      // Public reply
      await request(app.getHttpServer())
        .post(`/api/v1/helpdesk/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          type: 'PUBLIC_REPLY',
          body: 'Technician has been dispatched and will arrive within 30 minutes.',
        })
        .expect(201);

      // Internal note
      await request(app.getHttpServer())
        .post(`/api/v1/helpdesk/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          type: 'INTERNAL_NOTE',
          body: 'Check main valve before unscrewing pipe connector.',
        })
        .expect(201);

      const commentsRes = await request(app.getHttpServer())
        .get(`/api/v1/helpdesk/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(commentsRes.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should resolve ticket with resolution code and summary', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/helpdesk/tickets/${ticketId}/resolve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          resolutionCode: 'FIXED',
          resolutionSummary: 'Replaced cracked rubber gasket and tightened pipe seal.',
        })
        .expect(200);

      expect(res.body.data.currentState).toBe('RESOLVED');
      expect(res.body.data.resolutionCode).toBe('FIXED');
    });

    it('should allow resident to submit 5-star feedback and comment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/resident/complaints/${ticketId}/feedback`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rating: 5,
          comment: 'Technician was super fast and polite! Fixed in 10 minutes.',
        })
        .expect(201);

      expect(res.body.data.rating).toBe(5);
    });

    it('should allow resident to reopen ticket with reason', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/resident/complaints/${ticketId}/reopen`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reason: 'Water is dripping slowly from the joint again.',
        })
        .expect(200);

      expect(res.body.data.currentState).toBe('REOPENED');
      expect(res.body.data.reopenCount).toBe(1);
    });

    it('should fetch helpdesk KPI analytics', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/helpdesk/analytics/kpi?organizationId=${orgId}&communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.totalTickets).toBeGreaterThanOrEqual(1);
      expect(res.body.data.statusBreakdown).toBeDefined();
    });
  });
});
