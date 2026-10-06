import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Workflow, Approval, Rules & SLA Engine (Phase 7 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let _communityId: string;
  let _adminUserId: string;

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
    _adminUserId = loginRes.body.data.user.id;

    const org = await prisma.organization.findFirst({
      where: { slug: 'community-os-demo' },
    });
    orgId = org!.id;

    const comm = await prisma.community.findFirst({
      where: { organizationId: orgId, slug: 'green-valley-township' },
    });
    _communityId = comm!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ===========================================================================
  // 1. BUSINESS CALENDARS & SLA ENGINE
  // ===========================================================================
  describe('Business Calendars & SLA Policy Engine', () => {
    let calendarId: string;
    let slaPolicyId: string;

    it('should create and retrieve a business working calendar', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/calendars')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          key: `cal.standard.${testSuffix}`,
          name: 'HQ Working Calendar',
          description: 'Mon-Fri 9AM-5PM working calendar',
          scopeType: 'ORGANIZATION',
          organizationId: orgId,
          timezone: 'UTC',
          workingDays: [1, 2, 3, 4, 5],
          workingHours: { start: '09:00', end: '17:00' },
          holidays: ['2026-12-25'],
          isDefault: false,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.key).toBe(`cal.standard.${testSuffix}`);
      expect(res.body.data.workingDays).toEqual([1, 2, 3, 4, 5]);
      calendarId = res.body.data.id;

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/calendars')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(listRes.body.data.items.some((c: { id: string }) => c.id === calendarId)).toBe(true);
    });

    it('should create and publish an SLA policy definition', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/sla/policies')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          key: `sla.resolution.${testSuffix}`,
          name: '24-Hour Resolution Policy',
          description: 'SLA requiring resolution within 24 business working hours',
          organizationId: orgId,
          scopeType: 'ORGANIZATION',
          metricType: 'TIME_TO_RESOLUTION',
          durationMinutes: 1440,
          useBusinessHours: true,
          calendarId,
          warningThresholdPercent: 80,
        })
        .expect(201);

      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.version).toBe(1);
      slaPolicyId = res.body.data.id;

      const pubRes = await request(app.getHttpServer())
        .post(`/api/v1/sla/policies/${slaPolicyId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(pubRes.body.data.status).toBe('PUBLISHED');
      expect(pubRes.body.data.publishedAt).toBeDefined();
    });

    it('should trigger SLA sweeper reconciliation without error', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/sla/reconcile')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.warningsProcessed).toBe('number');
      expect(typeof res.body.data.breachesProcessed).toBe('number');
    });
  });

  // ===========================================================================
  // 2. RULES ENGINE & DRY-RUN SIMULATOR
  // ===========================================================================
  describe('Rules & Condition Guard Engine', () => {
    let ruleId: string;

    it('should list fact catalog registry', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/rules/facts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.some((f: { path: string }) => f.path === 'resource.amount')).toBe(
        true,
      );
      expect(
        res.body.data.items.some((f: { path: string }) => f.path === 'actor.isPlatformAdmin'),
      ).toBe(true);
    });

    it('should create and publish a rule definition with recursive condition AST', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/rules/definitions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          key: `rule.amount_threshold.${testSuffix}`,
          name: 'Budget Threshold Verification Guard',
          description: 'Ensures resource amount is <= 50,000 and priority is not CRITICAL',
          organizationId: orgId,
          scopeType: 'ORGANIZATION',
          resourceType: 'TEST_RESOURCE',
          conditionTree: {
            and: [
              {
                simple: {
                  field: 'resource.amount',
                  operator: 'LESS_THAN_OR_EQUAL',
                  value: 50000,
                },
              },
              {
                simple: {
                  field: 'resource.priority',
                  operator: 'NOT_EQUALS',
                  value: 'CRITICAL',
                },
              },
            ],
          },
          outputEffect: { maxThresholdApproved: true },
        })
        .expect(201);

      expect(res.body.data.status).toBe('DRAFT');
      ruleId = res.body.data.id;

      const pubRes = await request(app.getHttpServer())
        .post(`/api/v1/rules/definitions/${ruleId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(pubRes.body.data.status).toBe('PUBLISHED');
    });

    it('should simulate rule evaluation dry-run accurately', async () => {
      // Test 1: Passing case (amount 25000, priority MEDIUM)
      const passRes = await request(app.getHttpServer())
        .post(`/api/v1/rules/simulate?ruleId=${ruleId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          facts: {
            resource: {
              amount: 25000,
              priority: 'MEDIUM',
            },
          },
        })
        .expect(200);

      expect(passRes.body.data.passed).toBe(true);
      expect(passRes.body.data.outputEffect).toEqual({ maxThresholdApproved: true });
      expect(passRes.body.data.trace.nodeType).toBe('and');

      // Test 2: Failing case (amount 75000 > 50000)
      const failRes = await request(app.getHttpServer())
        .post(`/api/v1/rules/simulate?ruleId=${ruleId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          facts: {
            resource: {
              amount: 75000,
              priority: 'MEDIUM',
            },
          },
        })
        .expect(200);

      expect(failRes.body.data.passed).toBe(false);
      expect(failRes.body.data.outputEffect).toBeNull();
    });
  });

  // ===========================================================================
  // 3. APPROVAL POLICIES & MAKER-CHECKER DECISION LIFECYCLE
  // ===========================================================================
  describe('Approval Engine & Quorum Chains', () => {
    let policyId: string;

    it('should create and publish an approval policy definition with maker-checker', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/approvals/policies')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          key: `app.policy.management.${testSuffix}`,
          name: 'Management Sign-off Policy',
          description: 'Single-step manager quorum approval policy',
          organizationId: orgId,
          scopeType: 'ORGANIZATION',
          steps: [
            {
              order: 1,
              name: 'Executive Review',
              approverType: 'ROLE',
              approverValue: 'PLATFORM_ADMIN',
              quorumMode: 'ANY_ONE',
              minCount: 1,
              allowSelfApproval: true,
              rejectionBehavior: 'RETURN_TO_PREVIOUS_STATE',
            },
          ],
        })
        .expect(201);

      expect(res.body.data.status).toBe('DRAFT');
      policyId = res.body.data.id;

      const pubRes = await request(app.getHttpServer())
        .post(`/api/v1/approvals/policies/${policyId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(pubRes.body.data.status).toBe('PUBLISHED');
    });

    it('should query My Approvals inbox for pending decisions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/approvals/inbox')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  // ===========================================================================
  // 4. END-TO-END WORKFLOW STATE MACHINE
  // ===========================================================================
  describe('Workflow State Machine & Side Effects', () => {
    let workflowDefId: string;
    let workflowKey: string;
    let instanceId: string;

    it('should create and publish a valid workflow definition graph', async () => {
      workflowKey = `wf.test_lifecycle.${testSuffix}`;

      const res = await request(app.getHttpServer())
        .post('/api/v1/workflows/definitions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          key: workflowKey,
          name: 'Document Review Workflow',
          description: 'End-to-end document review lifecycle with rule guard and side effects',
          organizationId: orgId,
          scopeType: 'ORGANIZATION',
          entityType: 'TEST_RESOURCE',
          initialStateKey: 'DRAFT',
          states: [
            { key: 'DRAFT', label: 'Draft', type: 'START', isTerminal: false, displayOrder: 1 },
            {
              key: 'IN_REVIEW',
              label: 'In Review',
              type: 'ACTIVE',
              isTerminal: false,
              displayOrder: 2,
            },
            {
              key: 'APPROVED',
              label: 'Approved',
              type: 'ACTIVE',
              isTerminal: false,
              displayOrder: 3,
            },
            {
              key: 'COMPLETED',
              label: 'Completed',
              type: 'COMPLETED',
              isTerminal: true,
              displayOrder: 4,
            },
          ],
          transitions: [
            {
              key: 'tr_submit',
              fromState: 'DRAFT',
              toState: 'IN_REVIEW',
              action: 'submit',
              actionLabel: 'Submit for Review',
              guardRuleKey: `rule.amount_threshold.${testSuffix}`,
              guardRuleVersion: 1,
            },
            {
              key: 'tr_approve',
              fromState: 'IN_REVIEW',
              toState: 'APPROVED',
              action: 'approve',
              actionLabel: 'Approve Review',
            },
            {
              key: 'tr_complete',
              fromState: 'APPROVED',
              toState: 'COMPLETED',
              action: 'complete',
              actionLabel: 'Finalize & Close',
            },
          ],
        })
        .expect(201);

      expect(res.body.data.status).toBe('DRAFT');
      workflowDefId = res.body.data.id;

      const pubRes = await request(app.getHttpServer())
        .post(`/api/v1/workflows/definitions/${workflowDefId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(pubRes.body.data.status).toBe('PUBLISHED');
    });

    it('should start a workflow instance at initialStateKey', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/workflows/instances')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          workflowDefinitionKey: workflowKey,
          organizationId: orgId,
          resourceType: 'TEST_RESOURCE',
          resourceId: randomUUID(),
          contextSnapshot: { amount: 15000, priority: 'HIGH' },
        })
        .expect(201);

      expect(res.body.data.currentState).toBe('DRAFT');
      expect(res.body.data.status).toBe('RUNNING');
      expect(res.body.data.version).toBe(1);
      instanceId = res.body.data.id;
    });

    it('should query allowed actions for current state', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workflows/instances/${instanceId}/actions`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].action).toBe('submit');
      expect(res.body.data.items[0].targetState).toBe('IN_REVIEW');
    });

    it('should fail transition when guard rule evaluates to false', async () => {
      // Try transition with fact amount 90000 > 50000 (guard rule violation)
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workflows/instances/${instanceId}/transition`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          action: 'submit',
          expectedVersion: 1,
          context: { amount: 90000, priority: 'HIGH' },
        })
        .expect(400);

      expect(res.body.error.message).toContain('WORKFLOW_GUARD_FAILED');
    });

    it('should succeed transition when guard rule passes and progress state', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workflows/instances/${instanceId}/transition`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          action: 'submit',
          expectedVersion: 1,
          context: { amount: 20000, priority: 'LOW' },
        })
        .expect(200);

      expect(res.body.data.currentState).toBe('IN_REVIEW');
      expect(res.body.data.version).toBe(2);
    });

    it('should reject transition with version mismatch (optimistic concurrency conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workflows/instances/${instanceId}/transition`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          action: 'approve',
          expectedVersion: 1, // Stale version (actual is 2)
        })
        .expect(409);

      expect(res.body.error.message).toContain('WORKFLOW_CONCURRENCY_CONFLICT');
    });

    it('should transition to terminal state and mark instance COMPLETED', async () => {
      // 1. In Review -> Approved
      const appRes = await request(app.getHttpServer())
        .post(`/api/v1/workflows/instances/${instanceId}/transition`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          action: 'approve',
          expectedVersion: 2,
        })
        .expect(200);

      expect(appRes.body.data.currentState).toBe('APPROVED');
      expect(appRes.body.data.status).toBe('RUNNING');

      // 2. Approved -> Completed (Terminal)
      const compRes = await request(app.getHttpServer())
        .post(`/api/v1/workflows/instances/${instanceId}/transition`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          action: 'complete',
          expectedVersion: 3,
        })
        .expect(200);

      expect(compRes.body.data.currentState).toBe('COMPLETED');
      expect(compRes.body.data.status).toBe('COMPLETED');
      expect(compRes.body.data.completedAt).toBeDefined();
    });

    it('should verify complete transition history and audit trail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workflows/instances/${instanceId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.data.history).toBeDefined();
      expect(res.body.data.history.length).toBe(4); // START, submit, approve, complete
      expect(res.body.data.history[0].action).toBe('complete');
    });

    it('should support privileged emergency manual override with audit reason', async () => {
      // Start a second instance to test admin override
      const startRes = await request(app.getHttpServer())
        .post('/api/v1/workflows/instances')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          workflowDefinitionKey: workflowKey,
          organizationId: orgId,
          resourceType: 'TEST_RESOURCE',
          resourceId: randomUUID(),
        })
        .expect(201);

      const overrideInstId = startRes.body.data.id;

      const overrideRes = await request(app.getHttpServer())
        .post(`/api/v1/workflows/instances/${overrideInstId}/override`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          targetState: 'APPROVED',
          reason: 'Emergency executive exception bypass',
          expectedVersion: 1,
        })
        .expect(200);

      expect(overrideRes.body.data.currentState).toBe('APPROVED');

      const fullInst = await request(app.getHttpServer())
        .get(`/api/v1/workflows/instances/${overrideInstId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(
        fullInst.body.data.history.some((h: { action: string }) => h.action === 'MANUAL_OVERRIDE'),
      ).toBe(true);
    });
  });
});
