import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinancialIntegrityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async runIntegrityAudit(accountingEntityId: string) {
    const results: Array<{
      checkType: string;
      status: 'PASSED' | 'FAILED';
      details: any;
    }> = [];

    const postedJournals = await this.prisma.journalEntry.findMany({
      where: { accountingEntityId, status: 'POSTED' },
      include: { lines: true },
    });

    const unbalancedJournals: string[] = [];
    for (const j of postedJournals) {
      const drSum = j.lines.reduce((s, l) => s + Number(l.debitAmount), 0);
      const crSum = j.lines.reduce((s, l) => s + Number(l.creditAmount), 0);
      if (Math.abs(drSum - crSum) >= 0.001) {
        unbalancedJournals.push(j.journalNumber);
      }
    }

    results.push({
      checkType: 'JOURNAL_BALANCE',
      status: unbalancedJournals.length === 0 ? 'PASSED' : 'FAILED',
      details: { unbalancedCount: unbalancedJournals.length, journals: unbalancedJournals },
    });

    const glEntries = await this.prisma.generalLedgerEntry.findMany({
      where: { accountingEntityId },
    });

    const totalGLDr = glEntries.reduce((s, e) => s + Number(e.debitAmount), 0);
    const totalGLCr = glEntries.reduce((s, e) => s + Number(e.creditAmount), 0);
    const isGLBalanced = Math.abs(totalGLDr - totalGLCr) < 0.01;

    results.push({
      checkType: 'TOTAL_CONSISTENCY',
      status: isGLBalanced ? 'PASSED' : 'FAILED',
      details: {
        totalDebit: totalGLDr,
        totalCredit: totalGLCr,
        diff: Math.abs(totalGLDr - totalGLCr),
      },
    });

    for (const r of results) {
      await this.prisma.financialIntegrityLog.create({
        data: {
          accountingEntityId,
          checkType: r.checkType as any,
          status: r.status,
          mismatchDetails: r.details,
        },
      });

      if (r.status === 'FAILED') {
        this.eventsService.publish(
          createEvent(
            (DOMAIN_EVENTS as any).FINANCE_INTEGRITY_ISSUE_DETECTED ??
              'finance.integrity_issue.detected.v1',
            r,
            { organizationId: accountingEntityId },
          ),
        );
      }
    }

    return {
      allPassed: results.every((r) => r.status === 'PASSED'),
      checks: results,
    };
  }

  async rebuildAccountBalancesFromLedger(accountingEntityId: string) {
    await this.prisma.accountBalance.deleteMany({
      where: { accountingEntityId },
    });

    const glEntries = await this.prisma.generalLedgerEntry.findMany({
      where: { accountingEntityId },
      orderBy: [{ postingDate: 'asc' }, { sequence: 'asc' }],
    });

    const grainMap = new Map<
      string,
      {
        dr: number;
        cr: number;
        accountId: string;
        fiscalYearId: string;
        periodId: string;
        fundId?: string | null;
        costCenterId?: string | null;
      }
    >();

    for (const e of glEntries) {
      const key = `${e.accountId}_${e.fiscalYearId}_${e.periodId}_${e.fundId || 'null'}_${e.costCenterId || 'null'}`;
      const current = grainMap.get(key) || {
        dr: 0,
        cr: 0,
        accountId: e.accountId,
        fiscalYearId: e.fiscalYearId,
        periodId: e.periodId,
        fundId: e.fundId,
        costCenterId: e.costCenterId,
      };

      current.dr += Number(e.debitAmount);
      current.cr += Number(e.creditAmount);
      grainMap.set(key, current);
    }

    let rebuiltCount = 0;
    for (const val of grainMap.values()) {
      await this.prisma.accountBalance.create({
        data: {
          accountingEntityId,
          accountId: val.accountId,
          fiscalYearId: val.fiscalYearId,
          periodId: val.periodId,
          fundId: val.fundId,
          costCenterId: val.costCenterId,
          openingDebit: new Prisma.Decimal(0),
          openingCredit: new Prisma.Decimal(0),
          periodDebit: new Prisma.Decimal(val.dr),
          periodCredit: new Prisma.Decimal(val.cr),
          closingDebit: new Prisma.Decimal(val.dr),
          closingCredit: new Prisma.Decimal(val.cr),
        },
      });
      rebuiltCount++;
    }

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).FINANCE_PROJECTION_REBUILT ?? 'finance.projection.rebuilt.v1',
        { rebuiltCount, glEntriesCount: glEntries.length },
        { organizationId: accountingEntityId },
      ),
    );

    return { rebuiltCount, glEntriesCount: glEntries.length };
  }
}
