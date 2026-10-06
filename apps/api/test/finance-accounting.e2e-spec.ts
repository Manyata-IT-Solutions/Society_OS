import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';

describe('Enterprise Finance & Accounting Core (Phase 13 E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminAccessToken: string;
  let orgId: string;
  let communityId: string;

  let entityId: string;
  let fiscalYearId: string;
  let _period1Id: string;
  let period2Id: string;

  let accBankId: string;
  let _accCashId: string;
  let accARId: string;
  let accAPId: string;
  let _accGeneralFundId: string;
  let accMaintenanceIncomeId: string;
  let accUtilityExpId: string;
  let _accSecurityExpId: string;

  let fundOperatingId: string;
  let _fundSinkingId: string;
  let _ccAdminId: string;
  let ccElectricalId: string;

  let draftJournalId: string;
  let postedJournalId: string;

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
    const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'admin@communityos.io',
      password: 'Admin@CommunityOS2026!',
    });

    expect(loginRes.status).toBe(200);
    adminAccessToken = loginRes.body.data.tokens.accessToken;

    const org = await prisma.organization.findFirst();
    orgId = org!.id;

    const community = await prisma.community.findFirst({ where: { organizationId: orgId } });
    communityId = community!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. Accounting Entity Management
  // =========================================================================
  describe('1. Accounting Entity Management', () => {
    it('should create an AccountingEntity with base currency INR and timezone', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/finance/entities')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          organizationId: orgId,
          communityId,
          code: `ENT_${testSuffix}`,
          name: `Test Entity ${testSuffix}`,
          legalName: `Test Entity Society Association Reg No ${testSuffix}`,
          countryCode: 'IND',
          baseCurrency: 'INR',
          timezone: 'Asia/Kolkata',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.code).toBe(`ENT_${testSuffix}`);
      expect(res.body.data.baseCurrency).toBe('INR');
      entityId = res.body.data.id;
    });

    it('should get accounting entity details by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/entities/${entityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(entityId);
    });

    it('should list accounting entities for organization', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/entities?organizationId=${orgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 2. Fiscal Calendar & Periods Engine
  // =========================================================================
  describe('2. Fiscal Calendar & Periods Engine', () => {
    it('should create Fiscal Year 2026-27 and automatically generate 12 monthly periods', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/finance/fiscal/years')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          name: `FY 2026-27_${testSuffix}`,
          startDate: '2026-04-01',
          endDate: '2027-03-31',
          generatePeriods: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.periods).toBeDefined();
      expect(res.body.data.periods.length).toBe(12);

      fiscalYearId = res.body.data.id;
      _period1Id = res.body.data.periods[0].id;
      period2Id = res.body.data.periods[1].id;
    });

    it('should Soft Close period 2', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/fiscal/periods/${period2Id}/close`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          mode: 'SOFT_CLOSE',
          reason: 'End of period review',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('SOFT_CLOSED');
    });

    it('should Reopen period 2 with mandatory audit reason', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/fiscal/periods/${period2Id}/reopen`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reason: 'Reopened by auditor for late vendor invoice posting',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('OPEN');
    });
  });

  // =========================================================================
  // 3. Chart of Accounts & Templates
  // =========================================================================
  describe('3. Chart of Accounts & Standard Template', () => {
    it('should apply Indian Residential Society Standard COA template', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/accounts/template/standard-society?accountingEntityId=${entityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.appliedCount).toBeGreaterThanOrEqual(15);
    });

    it('should list all accounts created by template', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/accounts?accountingEntityId=${entityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      const accounts = res.body.data;
      expect(accounts.length).toBeGreaterThanOrEqual(15);

      accBankId = accounts.find((a: any) => a.accountCode === '1110')?.id;
      _accCashId = accounts.find((a: any) => a.accountCode === '1130')?.id;
      accARId = accounts.find((a: any) => a.accountCode === '1200')?.id;
      accAPId = accounts.find((a: any) => a.accountCode === '2100')?.id;
      _accGeneralFundId = accounts.find((a: any) => a.accountCode === '3100')?.id;
      accMaintenanceIncomeId = accounts.find((a: any) => a.accountCode === '4100')?.id;
      accUtilityExpId = accounts.find((a: any) => a.accountCode === '5200')?.id;
      _accSecurityExpId = accounts.find((a: any) => a.accountCode === '5300')?.id;

      expect(accBankId).toBeDefined();
      expect(accARId).toBeDefined();
      expect(accAPId).toBeDefined();
    });

    it('should verify AR and AP are configured as control accounts with direct manual posting disallowed', async () => {
      const arRes = await request(app.getHttpServer())
        .get(`/api/v1/finance/accounts/${accARId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(arRes.status).toBe(200);
      expect(arRes.body.data.isControlAccount).toBe(true);
      expect(arRes.body.data.allowManualPosting).toBe(false);
    });

    it('should create custom child ledger account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/finance/accounts')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          accountCode: `5150_${testSuffix}`,
          name: 'Swimming Pool Chemical & Upkeep Expenses',
          accountType: 'EXPENSE',
          accountSubType: 'REPAIRS_EXPENSE',
          parentAccountId: accUtilityExpId,
          normalBalance: 'DEBIT',
          postingAllowed: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.accountCode).toBe(`5150_${testSuffix}`);
    });
  });

  // =========================================================================
  // 4. Funds & Cost Centers
  // =========================================================================
  describe('4. Ring-fenced Funds & Cost Centers', () => {
    it('should create ring-fenced Funds (Operating & Sinking)', async () => {
      const opRes = await request(app.getHttpServer())
        .post('/api/v1/finance/funds')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          code: `OP_${testSuffix}`,
          name: 'General Operations Fund',
          fundType: 'OPERATING',
          restrictionType: 'UNRESTRICTED',
        });

      expect(opRes.status).toBe(201);
      fundOperatingId = opRes.body.data.id;

      const sinkRes = await request(app.getHttpServer())
        .post('/api/v1/finance/funds')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          code: `SINK_${testSuffix}`,
          name: 'Sinking Capital Fund',
          fundType: 'SINKING',
          restrictionType: 'RESTRICTED',
        });

      expect(sinkRes.status).toBe(201);
      _fundSinkingId = sinkRes.body.data.id;
    });

    it('should create Cost Centers (Admin & Electrical)', async () => {
      const adminRes = await request(app.getHttpServer())
        .post('/api/v1/finance/cost-centers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          code: `CC_ADM_${testSuffix}`,
          name: 'Society Administration',
        });

      expect(adminRes.status).toBe(201);
      _ccAdminId = adminRes.body.data.id;

      const elecRes = await request(app.getHttpServer())
        .post('/api/v1/finance/cost-centers')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          code: `CC_ELEC_${testSuffix}`,
          name: 'Electrical Infrastructure',
        });

      expect(elecRes.status).toBe(201);
      ccElectricalId = elecRes.body.data.id;
    });
  });

  // =========================================================================
  // 5. Double-Entry Balance Invariant & Posting Engine
  // =========================================================================
  describe('5. Double-Entry Invariant & Posting Engine', () => {
    it('should REJECT creating an unbalanced journal entry (Dr != Cr)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/finance/journals')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          journalType: 'GENERAL',
          journalDate: '2026-04-10',
          description: 'Unbalanced Journal Test',
          lines: [
            {
              accountId: accUtilityExpId,
              description: 'Electricity expense',
              debitAmount: 10000,
              creditAmount: 0,
            },
            {
              accountId: accBankId,
              description: 'Bank payment',
              debitAmount: 0,
              creditAmount: 8000, // Diff of 2000!
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should REJECT journal with single line', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/finance/journals')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          journalDate: '2026-04-10',
          description: 'Single line test',
          lines: [
            {
              accountId: accUtilityExpId,
              description: 'Expense line',
              debitAmount: 5000,
              creditAmount: 0,
            },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should successfully create a balanced DRAFT journal voucher', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/finance/journals')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          journalType: 'GENERAL',
          journalDate: '2026-04-15',
          description: 'April 2026 Common Area Electricity Payment',
          reference: 'BESCOM-E2E-001',
          lines: [
            {
              accountId: accUtilityExpId,
              description: 'BESCOM electricity charges',
              debitAmount: 18500,
              creditAmount: 0,
              costCenterId: ccElectricalId,
              fundId: fundOperatingId,
            },
            {
              accountId: accBankId,
              description: 'HDFC bank transfer',
              debitAmount: 0,
              creditAmount: 18500,
              fundId: fundOperatingId,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.totalDebit).toBe(18500);
      expect(res.body.data.totalCredit).toBe(18500);
      draftJournalId = res.body.data.id;
    });

    it('should submit draft journal for approval', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/journals/${draftJournalId}/submit`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('SUBMITTED');
    });

    it('should approve submitted journal', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/journals/${draftJournalId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('should POST approved journal and atomically write to General Ledger', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/journals/${draftJournalId}/post`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('POSTED');
      expect(res.body.data.postedAt).toBeDefined();
      postedJournalId = res.body.data.id;

      // Verify General Ledger entries exist
      const glEntries = await prisma.generalLedgerEntry.findMany({
        where: { journalEntryId: postedJournalId },
      });
      expect(glEntries.length).toBe(2);
    });

    it('should REJECT direct manual journal posting to control account (AR_CONTROL)', async () => {
      // Create a draft posting directly to AR control account
      const draftRes = await request(app.getHttpServer())
        .post('/api/v1/finance/journals')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          journalType: 'GENERAL',
          journalDate: '2026-04-18',
          description: 'Direct manual entry to AR control',
          lines: [
            {
              accountId: accARId, // Control account
              description: 'Direct debit to AR',
              debitAmount: 1000,
              creditAmount: 0,
            },
            {
              accountId: accMaintenanceIncomeId,
              description: 'Credit income',
              debitAmount: 0,
              creditAmount: 1000,
            },
          ],
        });

      expect(draftRes.status).toBe(201);
      const invalidJournalId = draftRes.body.data.id;

      // Posting should fail with control account restriction
      const postRes = await request(app.getHttpServer())
        .post(`/api/v1/finance/journals/${invalidJournalId}/post`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(postRes.status).toBe(400);
      expect(postRes.body.error?.message || postRes.body.message).toContain(
        'control account restricted from direct manual posting',
      );
    });
  });

  // =========================================================================
  // 6. Journal Reversal Engine
  // =========================================================================
  describe('6. Journal Reversal Engine', () => {
    it('should create opposite-sign reversal journal voucher and post it automatically', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/journals/${postedJournalId}/reverse`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reversalDate: '2026-04-20',
          reason: 'Duplicate payment voucher entered in error',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.journalType).toBe('REVERSAL');
      expect(res.body.data.status).toBe('POSTED');

      // Verify original journal is marked reversed
      const orig = await prisma.journalEntry.findUnique({
        where: { id: postedJournalId },
      });
      expect(orig!.reversedAt).toBeDefined();
      expect(orig!.reversalJournalId).toBe(res.body.data.id);
    });

    it('should REJECT reversing an already reversed journal entry', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/journals/${postedJournalId}/reverse`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          reason: 'Attempt second reversal',
        });

      expect(res.status).toBe(409);
    });
  });

  // =========================================================================
  // 7. Opening Balances Migration
  // =========================================================================
  describe('7. Opening Balances Migration', () => {
    it('should import and post balanced Opening Balances', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/finance/journals/opening-balances/import')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          fiscalYearId,
          asOfDate: '2026-04-01',
          entries: [
            {
              accountCode: '1110',
              debitAmount: 1000000,
              creditAmount: 0,
              description: 'Opening Bank Balance',
            },
            {
              accountCode: '1130',
              debitAmount: 50000,
              creditAmount: 0,
              description: 'Opening Petty Cash',
            },
            {
              accountCode: '3100',
              debitAmount: 0,
              creditAmount: 1050000,
              description: 'Opening General Operating Fund',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.journalType).toBe('OPENING');
      expect(res.body.data.status).toBe('POSTED');
      expect(res.body.data.totalDebit).toBe(1050000);
      expect(res.body.data.totalCredit).toBe(1050000);
    });

    it('should REJECT unbalanced Opening Balances import', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/finance/journals/opening-balances/import')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          accountingEntityId: entityId,
          fiscalYearId,
          asOfDate: '2026-04-01',
          entries: [
            { accountCode: '1110', debitAmount: 500000, creditAmount: 0 },
            { accountCode: '3100', debitAmount: 0, creditAmount: 400000 },
          ],
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 8. Financial Reports & Statements
  // =========================================================================
  describe('8. Financial Reports & Statements', () => {
    it('should generate balanced Trial Balance with SUM(Debits) == SUM(Credits)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/reports/trial-balance?accountingEntityId=${entityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.isBalanced).toBe(true);
      expect(res.body.data.totalClosingDebit).toBe(res.body.data.totalClosingCredit);
      expect(res.body.data.rows.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate Balance Sheet with Total Assets == Total Liabilities + Funds', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/reports/balance-sheet?accountingEntityId=${entityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.isBalanced).toBe(true);
      expect(res.body.data.totalAssets).toBe(res.body.data.totalLiabilitiesAndEquity);
    });

    it('should generate Income & Expenditure statement', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/reports/income-expenditure?accountingEntityId=${entityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.currency).toBe('INR');
    });

    it('should generate Account Ledger with running balance calculation', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/finance/ledger/account?accountingEntityId=${entityId}&accountId=${accBankId}&startDate=2026-04-01&endDate=2026-04-30`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.accountId).toBe(accBankId);
      expect(res.body.data.closingBalance).toBeGreaterThan(0);
      expect(res.body.data.entries.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 9. Financial Integrity & Reconciliation
  // =========================================================================
  describe('9. Autonomous Financial Integrity Audit & Projection Rebuild', () => {
    it('should run full financial integrity audit and return all checks PASSED', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/integrity/audit?accountingEntityId=${entityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.allPassed).toBe(true);
      expect(res.body.data.checks.length).toBeGreaterThanOrEqual(2);
    });

    it('should autonomously rebuild account balances from immutable General Ledger rows', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/integrity/rebuild-projections?accountingEntityId=${entityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.rebuiltCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.glEntriesCount).toBeGreaterThanOrEqual(1);
    });
  });
});
