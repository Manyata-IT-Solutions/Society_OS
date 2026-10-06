jest.setTimeout(60000);

import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Phase 16 — Enterprise Budgeting, Planning & Financial Control (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let organizationId: string;
  let accountingEntityId: string;
  let fiscalYearId: string;
  let expenseAccountId: string;
  let revenueAccountId: string;
  let fund1Id: string;
  let fund2Id: string;
  let costCenterId: string;
  let communityId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Login Admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@communityos.io', password: 'Admin@CommunityOS2026!' });

    adminToken = loginRes.body.tokens.accessToken;

    const org = await prisma.organization.findFirst();
    organizationId = org!.id;

    const entity = await prisma.accountingEntity.findFirst({ where: { organizationId } });
    accountingEntityId = entity!.id;

    const fy = await prisma.fiscalYear.findFirst({ where: { accountingEntityId } });
    fiscalYearId = fy!.id;

    const expAcc = await prisma.ledgerAccount.findFirst({
      where: { accountingEntityId, accountCode: '5100' },
    });
    expenseAccountId = expAcc!.id;

    const revAcc = await prisma.ledgerAccount.findFirst({
      where: { accountingEntityId, accountCode: '4100' },
    });
    revenueAccountId = revAcc!.id;

    const f1 = await prisma.fund.findFirst({ where: { accountingEntityId, code: 'OPERATING' } });
    const f2 = await prisma.fund.findFirst({ where: { accountingEntityId, code: 'SINKING' } });
    fund1Id = f1!.id;
    fund2Id = f2!.id;

    const cc = await prisma.costCenter.findFirst({ where: { accountingEntityId } });
    costCenterId = cc!.id;

    const comm = await prisma.community.findFirst({ where: { organizationId } });
    communityId = comm!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  let createdTemplateId: string;
  let createdBudgetId: string;
  let createdBudgetLineId: string;
  let secondBudgetLineId: string;
  const prReservationSourceId1 = randomUUID();
  const prReservationSourceId2 = randomUUID();
  const poCommitmentSourceId = randomUUID();

  it('1. Create Budget Template with OPEX & Revenue lines', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/budget-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        name: 'Society Master AOP Template',
        code: `TPL-${Date.now()}`,
        description: 'Standard multi-line residential template',
        budgetType: 'OPERATING',
        lines: [
          { accountId: revenueAccountId, lineType: 'REVENUE', weightPercent: 100 },
          { accountId: expenseAccountId, lineType: 'OPEX', weightPercent: 50 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.lines.length).toBe(2);
    createdTemplateId = res.body.id;
  });

  it('2. Create Draft Annual Operating Plan (AOP) with lines & spreads', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        accountingEntityId,
        communityId,
        fiscalYearId,
        name: 'FY 2026-27 Base Operating Budget',
        description: 'Draft plan for testing',
        budgetType: 'OPERATING',
        scenarioType: 'BASE',
        templateId: createdTemplateId,
        lines: [
          {
            lineNumber: 1,
            accountId: revenueAccountId,
            lineType: 'REVENUE',
            description: 'Resident Assessments Revenue',
            annualAmount: 12000000,
            allocationMethod: 'EQUAL',
          },
          {
            lineNumber: 2,
            accountId: expenseAccountId,
            fundId: fund1Id,
            costCenterId,
            lineType: 'OPEX',
            description: 'Repairs & Maintenance OPEX',
            annualAmount: 6000000,
            allocationMethod: 'EQUAL',
          },
          {
            lineNumber: 3,
            accountId: expenseAccountId,
            fundId: fund1Id,
            costCenterId,
            lineType: 'OPEX',
            description: 'Secondary Maintenance OPEX',
            annualAmount: 2000000,
            allocationMethod: 'EQUAL',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.budgetNumber).toBeDefined();
    expect(res.body.status).toBe('DRAFT');
    expect(Number(res.body.totalRevenue)).toBe(12000000);
    expect(Number(res.body.totalOpex)).toBe(8000000);
    expect(res.body.lines.length).toBe(3);

    createdBudgetId = res.body.id;
    createdBudgetLineId = res.body.lines[1].id;
    secondBudgetLineId = res.body.lines[2].id;
  });

  it('3. Submit Budget for Managerial Review', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/budgets/${createdBudgetId}/submit`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUBMITTED');
  });

  it('4. Approve Budget and snapshot baseline numbers', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/budgets/${createdBudgetId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.approvedAt).toBeDefined();
  });

  it('5. Activate Approved Budget as official active plan', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/budgets/${createdBudgetId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('6. Copy Budget to Next Year with 10% uplift', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/budgets/${createdBudgetId}/copy`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        targetFiscalYearId: fiscalYearId,
        name: 'FY 2027-28 Forecast Plan (10% Uplift)',
        percentageUplift: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DRAFT');
    expect(Number(res.body.totalRevenue)).toBe(13200000); // 12M + 10%
    expect(Number(res.body.totalOpex)).toBe(8800000); // 8M + 10%
  });

  it('7. Budget Spend Control Check: Allowed within available budget', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/budget-control/check')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        accountingEntityId,
        accountId: expenseAccountId,
        fundId: fund1Id,
        costCenterId,
        amount: 500000,
        sourceType: 'PURCHASE_REQUISITION',
      });

    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('ALLOWED');
    expect(res.body.availableBudget).toBeGreaterThanOrEqual(500000);
    expect(res.body.shortfall).toBe(0);
  });

  it('8. Budget Spend Control Check: Blocked when exceeding available budget', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/budget-control/check')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        accountingEntityId,
        accountId: expenseAccountId,
        fundId: fund1Id,
        costCenterId,
        amount: 100000000, // 100M exceeds budget
        sourceType: 'PURCHASE_ORDER',
      });

    expect(res.status).toBe(200);
    expect(res.body.decision).toBe('BLOCKED');
    expect(res.body.shortfall).toBeGreaterThan(0);
  });

  it('9. Append-Only Commitment Ledger: PR Reservation creation & release', async () => {
    // Reserve 100k
    const res = await request(app.getHttpServer())
      .post('/api/v1/budget-commitments/reserve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        budgetLineId: createdBudgetLineId,
        sourceType: 'PURCHASE_REQUISITION',
        sourceId: prReservationSourceId1,
        amount: 100000,
        reference: 'PR-2026-0001',
      });

    expect(res.status).toBe(201);
    expect(res.body.entryType).toBe('RESERVATION');
    expect(res.body.status).toBe('ACTIVE');

    // Release reservation
    const relRes = await request(app.getHttpServer())
      .post(`/api/v1/budget-commitments/release-reservation/${prReservationSourceId1}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(relRes.status).toBe(200);
  });

  it('10. Convert PR Reservation to PO Commitment without double counting', async () => {
    // Create new PR Reservation
    await request(app.getHttpServer())
      .post('/api/v1/budget-commitments/reserve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        budgetLineId: createdBudgetLineId,
        sourceType: 'PURCHASE_REQUISITION',
        sourceId: prReservationSourceId2,
        amount: 250000,
        reference: 'PR-2026-0002',
      });

    // Convert to PO
    const convertRes = await request(app.getHttpServer())
      .post('/api/v1/budget-commitments/convert')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        budgetLineId: createdBudgetLineId,
        reservationSourceId: prReservationSourceId2,
        poId: poCommitmentSourceId,
        poAmount: 250000,
        reference: 'PO-2026-0002',
      });

    expect(convertRes.status).toBe(201);
    expect(convertRes.body.entryType).toBe('COMMITMENT');
    expect(convertRes.body.status).toBe('ACTIVE');

    // Verify list
    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/budget-commitments?budgetLineId=${createdBudgetLineId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    const activeCommitment = listRes.body.find((e: any) => e.sourceId === poCommitmentSourceId);
    expect(activeCommitment).toBeDefined();
    expect(Number(activeCommitment.amount)).toBe(250000);
  });

  it('11. PO Revision: Adjust Commitment amount in append-only ledger', async () => {
    const adjRes = await request(app.getHttpServer())
      .post('/api/v1/budget-commitments/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        poId: poCommitmentSourceId,
        newAmount: 280000, // +30k scope increase
        reference: 'PO Revision #1',
      });

    expect(adjRes.status).toBe(201);
    expect(adjRes.body.entryType).toBe('COMMITMENT_ADJUSTMENT');
    expect(Number(adjRes.body.amount)).toBe(30000);
  });

  it('12. Formal Budget Amendment: Update Line amount & recalculate available budget', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/budget-amendments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        budgetId: createdBudgetId,
        reason: 'Emergency generator overhaul supplementary grant',
        lines: [
          {
            budgetLineId: createdBudgetLineId,
            amountChange: 500000,
            newAnnualAmount: 6500000,
            reason: 'Generator breakdown repairs',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.amendmentNumber).toBeDefined();
    expect(Number(res.body.netAmountChange)).toBe(500000);

    // Verify updated budget line
    const budgetRes = await request(app.getHttpServer())
      .get(`/api/v1/budgets/${createdBudgetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const updatedLine = budgetRes.body.lines.find((l: any) => l.id === createdBudgetLineId);
    expect(Number(updatedLine.currentAmount)).toBe(6500000);
  });

  it('13. Budget Transfer: Transfer between lines within same fund', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/budget-transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceBudgetLineId: createdBudgetLineId,
        destinationBudgetLineId: secondBudgetLineId,
        amount: 200000,
        reason: 'Reallocate surplus to secondary maintenance',
      });

    expect(res.status).toBe(201);
    expect(res.body.transferNumber).toBeDefined();
    expect(res.body.status).toBe('POSTED');

    // Verify source and dest amounts
    const budgetRes = await request(app.getHttpServer())
      .get(`/api/v1/budgets/${createdBudgetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const source = budgetRes.body.lines.find((l: any) => l.id === createdBudgetLineId);
    const dest = budgetRes.body.lines.find((l: any) => l.id === secondBudgetLineId);

    expect(Number(source.currentAmount)).toBe(6300000); // 6.5M - 200k
    expect(Number(dest.currentAmount)).toBe(2200000); // 2.0M + 200k
  });

  it('14. Cross-Fund Budget Transfer Isolation: Rejected when crossing restricted funds', async () => {
    // Create line with different fund
    const otherFundBudget = await request(app.getHttpServer())
      .post('/api/v1/budgets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        accountingEntityId,
        communityId,
        fiscalYearId,
        name: 'Sinking Fund Capital Plan',
        budgetType: 'CAPEX',
        lines: [
          {
            lineNumber: 1,
            accountId: expenseAccountId,
            fundId: fund2Id, // Sinking Fund
            annualAmount: 5000000,
          },
        ],
      });

    const sinkingLineId = otherFundBudget.body.lines[0].id;

    // Attempt transfer from Operating to Sinking fund
    const res = await request(app.getHttpServer())
      .post('/api/v1/budget-transfers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceBudgetLineId: createdBudgetLineId,
        destinationBudgetLineId: sinkingLineId,
        amount: 100000,
        reason: 'Illegal cross fund transfer',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Cross-Fund transfer not allowed');
  });

  it('15. CAPEX Planning: Create Initiative and update physical progress', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/capex')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organizationId,
        communityId,
        code: `CAPEX-${Date.now()}`,
        name: 'STP Aeration Blower Replacement',
        category: 'STP',
        priority: 'HIGH',
        estimatedCost: 1200000,
        approvedBudget: 1200000,
        fundId: fund2Id,
      });

    expect(createRes.status).toBe(201);
    const capexId = createRes.body.id;

    const progRes = await request(app.getHttpServer())
      .post(`/api/v1/capex/${capexId}/progress`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        progressPercent: 75,
        forecastCost: 1250000,
      });

    expect(progRes.status).toBe(200);
    expect(Number(progRes.body.physicalProgressPercent)).toBe(75);
    expect(Number(progRes.body.forecastCost)).toBe(1250000);
  });

  it('16. Multi-Fund Planning: Create and query Sinking Fund position', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/fund-plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fundId: fund2Id,
        fiscalYearId,
        openingAvailable: 5000000,
        plannedContribution: 2400000,
        plannedUsage: 3500000,
      });

    expect(res.status).toBe(201);
    expect(Number(res.body.projectedClosing)).toBe(3900000); // 5M + 2.4M - 3.5M
  });

  it('17. Financial Forecasting: Generate Commitment-Aware Year-End Forecast', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/forecasts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accountingEntityId,
        fiscalYearId,
        name: 'Q2 Latest Estimate (LE2)',
        forecastType: 'LATEST_ESTIMATE',
        method: 'COMMITMENT_AWARE',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.lines.length).toBeGreaterThan(0);
  });

  it('18. Variance Analysis & Explanation Notes', async () => {
    const reportRes = await request(app.getHttpServer())
      .get(`/api/v1/variance?budgetId=${createdBudgetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reportRes.status).toBe(200);
    expect(reportRes.body.length).toBeGreaterThan(0);

    const firstItem = reportRes.body[0];
    expect(firstItem.budgetAmount).toBeDefined();
    expect(firstItem.classification).toBeDefined();

    // Add Explanation note
    const expRes = await request(app.getHttpServer())
      .post('/api/v1/variance/explanations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        budgetLineId: createdBudgetLineId,
        varianceAmount: 200000,
        category: 'PRICE_INCREASE',
        reason: 'Unexpected hike in vendor spare part rates',
        comment: 'Negotiated discount for next quarter maintenance cycle',
      });

    expect(expRes.status).toBe(201);
    expect(expRes.body.id).toBeDefined();
  });

  it('19. Executive Dashboard KPIs & Spend Pipeline', async () => {
    const kpiRes = await request(app.getHttpServer())
      .get(
        `/api/v1/budget-dashboard/kpis?accountingEntityId=${accountingEntityId}&fiscalYearId=${fiscalYearId}`,
      )
      .set('Authorization', `Bearer ${adminToken}`);

    expect(kpiRes.status).toBe(200);
    expect(kpiRes.body.currentApprovedBudget).toBeDefined();
    expect(kpiRes.body.availableBudget).toBeDefined();

    const pipeRes = await request(app.getHttpServer())
      .get(`/api/v1/budget-dashboard/spend-pipeline?accountingEntityId=${accountingEntityId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pipeRes.status).toBe(200);
    expect(pipeRes.body.budget).toBeDefined();
  });
});
