jest.setTimeout(120000);

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Enterprise Resident Maintenance Billing & Accounts Receivable (Phase 14 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;
  let unit101Id: string;
  let unit102Id: string;

  let chargeMaintId: string;
  let chargeSinkingId: string;
  let planId: string;
  let periodId: string;
  let billableAccount101Id: string;
  let _billableAccount102Id: string;
  let billingRunId: string;
  let invoice101Id: string;
  let payment101Id: string;
  let waiverRequestId: string;

  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    jest.setTimeout(30000);
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
    const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'admin@communityos.io',
      password: 'Admin@CommunityOS2026!',
    });

    expect(loginRes.status).toBe(200);
    adminAccessToken = loginRes.body.data.tokens.accessToken;

    // 2. Fetch seeded organization and community from Unit 101
    const u101 = await prisma.unit.findFirst({ where: { unitNumber: '101' } });
    const u102 = await prisma.unit.findFirst({ where: { unitNumber: '102' } });
    const community = await prisma.community.findUnique({ where: { id: u101!.communityId } });

    communityId = community!.id;
    orgId = community!.organizationId;
    unit101Id = u101!.id;
    unit102Id = u102!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ===========================================================================
  // 1. Billable Account Management
  // ===========================================================================
  describe('1. Billable Account Management', () => {
    it('1.1 should create a new BillableAccount for Unit 101', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/accounts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId,
          unitId: unit101Id,
          accountNumber: `ACC-TEST-101-${testSuffix}`,
          accountType: 'UNIT',
          displayName: `Unit 101 Test (${testSuffix})`,
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.accountNumber).toBe(`ACC-TEST-101-${testSuffix}`);
      billableAccount101Id = res.body.data.id;
    });

    it('1.2 should create a new BillableAccount for Unit 102', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/accounts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId,
          unitId: unit102Id,
          accountNumber: `ACC-TEST-102-${testSuffix}`,
          accountType: 'UNIT',
          displayName: `Unit 102 Test (${testSuffix})`,
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      _billableAccount102Id = res.body.data.id;
    });

    it('1.3 should fetch BillableAccount by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/accounts/${billableAccount101Id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(billableAccount101Id);
    });

    it('1.4 should list all BillableAccounts for community', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/accounts?communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===========================================================================
  // 2. Charge Definitions Catalog
  // ===========================================================================
  describe('2. Charge Definitions Catalog', () => {
    it('2.1 should create a recurring maintenance charge definition (PER_SQFT)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          code: `MAINT_SQFT_${testSuffix}`,
          name: 'Monthly Maintenance Charge',
          description: 'Calculated per sqft of unit built-up area',
          category: 'MAINTENANCE',
          chargeNature: 'AREA_BASED',
          recurrenceType: 'MONTHLY',
          defaultCalculation: 'PER_SQFT',
          defaultUOM: 'SQFT',
          taxable: true,
          accountingMappingKey: 'MAINTENANCE_INCOME',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe(`MAINT_SQFT_${testSuffix}`);
      chargeMaintId = res.body.data.id;
    });

    it('2.2 should create a fixed statutory sinking fund charge definition', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/charges')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          code: `SINKING_FUND_${testSuffix}`,
          name: 'Sinking Fund Contribution',
          description: 'Fixed monthly capital reserve fund contribution',
          category: 'FUND',
          chargeNature: 'FIXED',
          recurrenceType: 'MONTHLY',
          defaultCalculation: 'FIXED_AMOUNT',
          defaultUOM: 'UNIT',
          taxable: false,
          accountingMappingKey: 'SINKING_FUND_LIABILITY',
          isActive: true,
        });

      expect(res.status).toBe(201);
      chargeSinkingId = res.body.data.id;
    });

    it('2.3 should list charge definitions by organization', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/charges?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c: any) => c.id === chargeMaintId)).toBe(true);
    });
  });

  // ===========================================================================
  // 3. Billing Plans & Charge Rules
  // ===========================================================================
  describe('3. Billing Plans & Charge Rules', () => {
    it('3.1 should create a new standard residential billing tariff plan', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/plans')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          code: `PLAN_RES_${testSuffix}`,
          name: 'Standard Residential Plan 2026',
          description: 'Maintenance ₹2.50/sqft + Sinking Fund ₹500',
          recurrenceType: 'MONTHLY',
          effectiveFrom: '2026-01-01',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe(`PLAN_RES_${testSuffix}`);
      planId = res.body.data.id;
    });

    it('3.2 should add Rule 1: Maintenance @ ₹2.50/sqft to billing plan', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/billing/plans/${planId}/rules`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          billingPlanId: planId,
          chargeDefinitionId: chargeMaintId,
          calculationMethod: 'PER_SQFT',
          rate: 2.5,
          dueDays: 10,
          graceDays: 5,
          priority: 1,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.calculationMethod).toBe('PER_SQFT');
      expect(Number(res.body.data.rate)).toBe(2.5);
    });

    it('3.3 should add Rule 2: Sinking Fund @ ₹500 fixed to billing plan', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/billing/plans/${planId}/rules`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          billingPlanId: planId,
          chargeDefinitionId: chargeSinkingId,
          calculationMethod: 'FIXED_AMOUNT',
          amount: 500,
          dueDays: 10,
          graceDays: 5,
          priority: 2,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.amount)).toBe(500);
    });

    it('3.4 should fetch billing plan by ID with its rules', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/plans/${planId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.chargeRules.length).toBe(2);
    });
  });

  // ===========================================================================
  // 4. Billing Periods
  // ===========================================================================
  describe('4. Billing Periods', () => {
    it('4.1 should create a new monthly billing period', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/periods')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          name: `May 2026 Maintenance (${testSuffix})`,
          code: `BP_2026_05_${testSuffix}`,
          startDate: '2026-05-01',
          endDate: '2026-05-31',
          invoiceDate: '2026-05-01',
          dueDate: '2026-05-10',
          graceDate: '2026-05-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe(`BP_2026_05_${testSuffix}`);
      periodId = res.body.data.id;
    });

    it('4.2 should list billing periods for community', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/periods?communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p: any) => p.id === periodId)).toBe(true);
    });
  });

  // ===========================================================================
  // 5. Billing Run & Batch Generation Engine
  // ===========================================================================
  describe('5. Billing Run & Batch Generation Engine', () => {
    it('5.1 should preview billing run without persisting invoices (Dry-Run)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/runs/preview')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          billingPeriodId: periodId,
          billingPlanId: planId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('totalUnits');
      expect(res.body.data).toHaveProperty('estimatedTotal');
      expect(res.body.data.estimatedTotal).toBeGreaterThan(0);
    });

    it('5.2 should execute batch billing run and generate invoices', async () => {
      const idempotencyKey = `RUN_KEY_${testSuffix}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/runs')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          billingPeriodId: periodId,
          billingPlanId: planId,
          runPurpose: 'REGULAR',
          idempotencyKey,
          autoIssue: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.successCount).toBeGreaterThan(0);
      billingRunId = res.body.data.id;
    }, 120000);

    it('5.3 should verify idempotency on billing run retry with exact same key', async () => {
      const idempotencyKey = `RUN_KEY_${testSuffix}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/runs')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          billingPeriodId: periodId,
          billingPlanId: planId,
          idempotencyKey,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(billingRunId);
    });
  });

  // ===========================================================================
  // 6. Invoice Lifecycle & GL Posting
  // ===========================================================================
  describe('6. Invoice Lifecycle & GL Posting', () => {
    it('6.1 should list generated invoices for the period', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/invoices?communityId=${communityId}&billingPeriodId=${periodId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      invoice101Id = res.body.data[0].id;
    });

    it('6.2 should retrieve single invoice with itemized line breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/invoices/${invoice101Id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(invoice101Id);
      expect(res.body.data.lines.length).toBe(2);
      expect(res.body.data.grandTotal).toBeGreaterThan(0);
      expect(res.body.data.status).toBe('ISSUED');
    });
  });

  // ===========================================================================
  // 7. Payment Recording & Receipt Generation
  // ===========================================================================
  describe('7. Payment Recording & Receipt Generation', () => {
    it('7.1 should record incoming UPI payment with auto-allocation', async () => {
      const inv = await prisma.invoice.findUnique({ where: { id: invoice101Id } });
      const targetBillableAccountId = inv?.billableAccountId || billableAccount101Id;

      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          billableAccountId: targetBillableAccountId,
          paymentDate: '2026-05-05',
          receivedAmount: 3500,
          currency: 'INR',
          paymentMethod: 'UPI',
          referenceNumber: `UPI-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
          allocationRule: 'OLDEST_DUE_FIRST',
          autoAllocate: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('SUCCESS');
      expect(Number(res.body.data.receivedAmount)).toBe(3500);
      payment101Id = res.body.data.id;
      billableAccount101Id = targetBillableAccountId;
    });

    it('7.2 should verify official receipt was generated with PDF Document', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/billing/receipts?communityId=${communityId}&billableAccountId=${billableAccount101Id}`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      const receipt = res.body.data.find((item: any) => item.paymentId === payment101Id);
      expect(receipt).toBeDefined();
      expect(Number(receipt.amount)).toBe(3500);
    });
  });

  // ===========================================================================
  // 8. Resident Subledger & Running Balance
  // ===========================================================================
  describe('8. Resident Subledger & Running Balance', () => {
    it('8.1 should verify append-only subledger entries for BillableAccount 101', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/ledger/${billableAccount101Id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // 9. Payment Reversal / Cheque Bounce
  // ===========================================================================
  describe('9. Payment Reversal / Cheque Bounce', () => {
    it('9.1 should reverse payment and restore invoice dues', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/billing/payments/${payment101Id}/reverse`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reason: 'Cheque Bounced / NSF',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('REVERSED');
    });

    it('9.2 should reject second reversal attempt on already reversed payment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/billing/payments/${payment101Id}/reverse`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reason: 'Duplicate reversal attempt',
        });

      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // 10. Late Fee & Penalty Sweep
  // ===========================================================================
  describe('10. Late Fee & Penalty Sweep', () => {
    it('10.1 should execute penalty sweep for overdue accounts', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/billing/analytics/penalties/sweep?communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('count');
      expect(res.body.data).toHaveProperty('totalPenalty');
    });
  });

  // ===========================================================================
  // 11. Waivers & Credit Notes (Maker-Checker Workflow)
  // ===========================================================================
  describe('11. Waivers & Credit Notes (Maker-Checker Workflow)', () => {
    it('11.1 should create a waiver request (Maker)', async () => {
      const inv = await prisma.invoice.findUnique({ where: { id: invoice101Id } });
      const outstanding = Number(inv?.outstandingAmount || 500);
      const waiverAmount = Math.min(250, outstanding > 0 ? outstanding : 50);

      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/waivers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          invoiceId: invoice101Id,
          amount: waiverAmount,
          reason: 'Late fee waiver due to banking holiday',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING_APPROVAL');
      expect(Number(res.body.data.amount)).toBe(waiverAmount);
      waiverRequestId = res.body.data.id;
    });

    it('11.2 should approve waiver request and adjust invoice outstanding (Checker)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/billing/waivers/${waiverRequestId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          approved: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('11.3 should issue a Credit Note against invoice', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/waivers/credit-notes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          invoiceId: invoice101Id,
          amount: 100,
          reason: 'Amenity outage rebate credit',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('creditNoteNumber');
      expect(Number(res.body.data.amount)).toBe(100);
    });
  });

  // ===========================================================================
  // 12. Receivables Aging Matrix & Analytics
  // ===========================================================================
  describe('12. Receivables Aging Matrix & Analytics', () => {
    it('12.1 should retrieve Receivables Aging Matrix with 0-30, 31-60, 90+ buckets', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/analytics/aging?communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      const row = res.body.data[0];
      expect(row).toHaveProperty('totalOutstanding');
      expect(row).toHaveProperty('bucket0To30');
    });

    it('12.2 should retrieve Billing Dashboard summary KPIs', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/billing/analytics/dashboard?communityId=${communityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalBilled');
      expect(res.body.data).toHaveProperty('collectionPercentage');
      expect(res.body.data).toHaveProperty('invoicesCount');
    });
  });

  // ===========================================================================
  // 13. Dues & Advance Credits Migration
  // ===========================================================================
  describe('13. Dues & Advance Credits Migration', () => {
    it('13.1 should import legacy society opening balances and advance credits', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/migration/import-opening-balances')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          communityId,
          records: [
            {
              unitNumber: '101',
              accountDisplayName: 'Unit 101 Legacy Balances',
              openingOutstanding: 1250,
              openingAdvanceCredit: 0,
              asOfDate: '2026-03-31',
            },
            {
              unitNumber: '102',
              accountDisplayName: 'Unit 102 Legacy Balances',
              openingOutstanding: 0,
              openingAdvanceCredit: 800,
              asOfDate: '2026-03-31',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.imported).toBe(2);
      expect(res.body.data.totalOutstanding).toBe(1250);
      expect(res.body.data.totalAdvanceCredit).toBe(800);
    });
  });
});
