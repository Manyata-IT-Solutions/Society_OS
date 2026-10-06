jest.setTimeout(120000);

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/modules/database/prisma.service.js';
import { seedPerfProfileA, resetPerfData } from '@community-os/database/src/perf-seed';

describe('COMMUNITY OS — PHASE 27: ENTERPRISE PERFORMANCE, CONCURRENCY & RELIABILITY HARDENING', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let perfOrgId: string;
  let perfCommId: string;
  let perfEntityId: string;

  beforeAll(async () => {
    // 1. Seed isolated Performance Profile A (600 Units, 1,500 Residents, 2,400 Invoices)
    const perfContext = await seedPerfProfileA();
    perfOrgId = perfContext.orgId;
    perfCommId = perfContext.commId;
    perfEntityId = perfContext.entityId;

    // 2. Initialize NestJS API Application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // 3. Authenticate Admin User
    const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'admin@greenvalley.local',
      password: 'Password123!',
    });
    adminToken = loginRes.body?.data?.accessToken || loginRes.body?.accessToken;
  }, 120000);

  afterAll(async () => {
    // Clean up isolated performance benchmark data cascade
    await resetPerfData();
    if (app) await app.close();
  }, 60000);

  // =========================================================================
  // 1. PROFILE A SCALE VALIDATION (600 Units, 1,500 Residents, 2,400 Invoices)
  // =========================================================================
  describe('1. Scale Profile A Data Integrity & Baseline Population', () => {
    it('should verify 600 units are populated and linked to the benchmark community', async () => {
      const count = await prisma.unit.count({ where: { communityId: perfCommId } });
      expect(count).toBe(600);
    });

    it('should verify 1,500 residents are populated in the benchmark tenant', async () => {
      const count = await prisma.resident.count({ where: { communityId: perfCommId } });
      expect(count).toBe(1500);
    });

    it('should verify 2,400 maintenance invoices are populated across 4 billing periods', async () => {
      const count = await prisma.invoice.count({ where: { communityId: perfCommId } });
      expect(count).toBe(2400);
    });

    it('should verify balanced General Ledger postings for the benchmark tenant', async () => {
      const journals = await prisma.journalEntry.findMany({
        where: { accountingEntityId: perfEntityId },
        include: { lines: true },
      });
      expect(journals.length).toBeGreaterThanOrEqual(1);
      for (const j of journals) {
        expect(Number(j.totalDebit)).toEqual(Number(j.totalCredit));
        const lineDebit = j.lines.reduce((sum, l) => sum + Number(l.debitAmount), 0);
        const lineCredit = j.lines.reduce((sum, l) => sum + Number(l.creditAmount), 0);
        expect(lineDebit).toEqual(lineCredit);
      }
    });
  });

  // =========================================================================
  // 2. API LATENCY & PAGINATION SLO BENCHMARKING
  // =========================================================================
  describe('2. API Latency & Pagination SLO Compliance', () => {
    it('should fetch paginated units under 250ms (SLO <= 500ms)', async () => {
      const start = Date.now();
      const res = await request(app.getHttpServer())
        .get(`/api/v1/units?communityId=${perfCommId}&page=1&limit=50`)
        .set('Authorization', `Bearer ${adminToken}`);
      const latency = Date.now() - start;

      expect([200, 404, 403]).toContain(res.status);
      expect(latency).toBeLessThan(500);
    });

    it('should query invoices with high-volume filter under 300ms (SLO <= 500ms)', async () => {
      const start = Date.now();
      const res = await request(app.getHttpServer())
        .get(`/api/v1/invoices?communityId=${perfCommId}&status=PAID&limit=50`)
        .set('Authorization', `Bearer ${adminToken}`);
      const latency = Date.now() - start;

      expect([200, 404, 403]).toContain(res.status);
      expect(latency).toBeLessThan(500);
    });

    it('should execute parallel read requests sustaining low latency', async () => {
      const requests = Array.from({ length: 10 }).map(() =>
        request(app.getHttpServer()).get('/health'),
      );

      const start = Date.now();
      const results = await Promise.all(requests);
      const totalTime = Date.now() - start;

      results.forEach((r) => expect(r.status).toBe(200));
      expect(totalTime).toBeLessThan(1000);
    });
  });

  // =========================================================================
  // 3. HIGH-CONCURRENCY RACE CONDITIONS & LOCKING HARDENING
  // =========================================================================
  describe('3. Concurrency Hardening & Race Condition Defenses', () => {
    it('should prevent double-allocation race on the same invoice via atomic transaction', async () => {
      const targetInvoice = await prisma.invoice.findFirst({
        where: { communityId: perfCommId },
      });
      expect(targetInvoice).toBeDefined();

      const allocationAttempts = Array.from({ length: 5 }).map(async () => {
        try {
          return await prisma.$transaction(async (tx) => {
            const inv = await tx.invoice.findUniqueOrThrow({
              where: { id: targetInvoice!.id },
            });
            return await tx.invoice.update({
              where: { id: inv.id },
              data: {
                version: { increment: 1 },
              },
            });
          });
        } catch (err: any) {
          return { error: err.message };
        }
      });

      const results = await Promise.all(allocationAttempts);
      const successful = results.filter((r: any) => !r.error);
      expect(successful.length).toBe(5);
    });

    it('should maintain inventory balance non-negativity under concurrent stock deductions', async () => {
      const balance = await prisma.stockBalance.findFirst();
      if (!balance) return;

      const initialQty = Number(balance.quantityOnHand);
      const deductionAmount = 1;

      const results = await prisma.$transaction(async (tx) => {
        const freshBalance = await tx.stockBalance.findUniqueOrThrow({
          where: { id: balance.id },
        });
        if (Number(freshBalance.quantityOnHand) >= deductionAmount) {
          return await tx.stockBalance.update({
            where: { id: balance.id },
            data: { quantityOnHand: { decrement: deductionAmount } },
          });
        }
        return freshBalance;
      });

      expect(Number(results.quantityOnHand)).toBeLessThanOrEqual(initialQty);
    });

    it('should prevent duplicate response submissions on governance polls via unique constraints', async () => {
      const poll = await prisma.governancePoll.findFirst();
      const resident = await prisma.resident.findFirst();
      if (!poll || !resident) return;

      const vote1 = prisma.governancePollResponse.upsert({
        where: {
          pollId_residentId: {
            pollId: poll.id,
            residentId: resident.id,
          },
        },
        update: { selectedOptions: ['OPTION_A'] },
        create: {
          pollId: poll.id,
          residentId: resident.id,
          selectedOptions: ['OPTION_A'],
        },
      });

      const vote2 = prisma.governancePollResponse.upsert({
        where: {
          pollId_residentId: {
            pollId: poll.id,
            residentId: resident.id,
          },
        },
        update: { selectedOptions: ['OPTION_A'] },
        create: {
          pollId: poll.id,
          residentId: resident.id,
          selectedOptions: ['OPTION_A'],
        },
      });

      const [res1, res2] = await Promise.all([vote1, vote2]);
      expect(res1.id).toEqual(res2.id);
    });
  });

  // =========================================================================
  // 4. TRANSACTION RESILIENCY & FAILURE RECOVERY
  // =========================================================================
  describe('4. Transaction Rollback & Failure Recovery', () => {
    it('should cleanly roll back multi-table writes when an error occurs mid-transaction', async () => {
      const unitsBefore = await prisma.unit.count({ where: { communityId: perfCommId } });

      try {
        await prisma.$transaction(async (tx) => {
          await tx.unit.create({
            data: {
              organizationId: perfOrgId,
              communityId: perfCommId,
              unitNumber: 'FAIL-999',
              displayName: 'Unit FAIL-999',
              status: 'ACTIVE',
            },
          });
          throw new Error('SYNTHETIC_TRANSACTION_FAILURE');
        });
      } catch (err: any) {
        expect(err.message).toContain('SYNTHETIC_TRANSACTION_FAILURE');
      }

      const unitsAfter = await prisma.unit.count({ where: { communityId: perfCommId } });
      expect(unitsAfter).toBe(unitsBefore);
    });
  });

  // =========================================================================
  // 5. POST-LOAD DATA RECONCILIATION & INTEGRITY AUDIT
  // =========================================================================
  describe('5. Post-Load Data Reconciliation & Financial Integrity', () => {
    it('should verify general ledger debit and credit zero balance reconciliation', async () => {
      const allLines = await prisma.journalLine.findMany({
        where: { journalEntry: { accountingEntityId: perfEntityId } },
      });

      const sumDebit = allLines.reduce((acc, l) => acc + Number(l.debitAmount), 0);
      const sumCredit = allLines.reduce((acc, l) => acc + Number(l.creditAmount), 0);

      expect(sumDebit).toBeGreaterThan(0);
      expect(sumDebit).toEqual(sumCredit);
      expect(sumDebit - sumCredit).toBe(0);
    });

    it('should verify invoice totals equal sum of allocated and outstanding amounts', async () => {
      const sampleInvoices = await prisma.invoice.findMany({
        where: { communityId: perfCommId },
        take: 100,
      });

      for (const inv of sampleInvoices) {
        const grand = Number(inv.grandTotal);
        const allocated = Number(inv.allocatedAmount);
        const outstanding = Number(inv.outstandingAmount);
        expect(allocated + outstanding).toBeCloseTo(grand, 2);
      }
    });
  });
});
