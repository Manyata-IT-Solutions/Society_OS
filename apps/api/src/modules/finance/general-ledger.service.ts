import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AccountLedgerReport, AccountLedgerItem } from '@community-os/types';

@Injectable()
export class GeneralLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getGeneralLedger(params: {
    accountingEntityId: string;
    fiscalYearId?: string;
    periodId?: string;
    accountId?: string;
    fundId?: string;
    costCenterId?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const where: any = {
      accountingEntityId: params.accountingEntityId,
    };
    if (params.fiscalYearId) where.fiscalYearId = params.fiscalYearId;
    if (params.periodId) where.periodId = params.periodId;
    if (params.accountId) where.accountId = params.accountId;
    if (params.fundId) where.fundId = params.fundId;
    if (params.costCenterId) where.costCenterId = params.costCenterId;
    if (params.startDate || params.endDate) {
      where.postingDate = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.generalLedgerEntry.count({ where }),
      this.prisma.generalLedgerEntry.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 100,
        orderBy: [{ postingDate: 'asc' }, { sequence: 'asc' }],
        include: {
          account: true,
          journalEntry: true,
          fund: true,
          costCenter: true,
        },
      }),
    ]);

    return { total, items };
  }

  async getAccountLedger(
    accountingEntityId: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AccountLedgerReport> {
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');

    // 1. Calculate Opening Balance prior to startDate
    const priorEntries = await this.prisma.generalLedgerEntry.findMany({
      where: {
        accountingEntityId,
        accountId,
        postingDate: { lt: startDate },
      },
    });

    let openingBalance = 0;
    for (const e of priorEntries) {
      const dr = Number(e.debitAmount);
      const cr = Number(e.creditAmount);
      if (account.normalBalance === 'DEBIT') {
        openingBalance += dr - cr;
      } else {
        openingBalance += cr - dr;
      }
    }

    // 2. Fetch Period Entries
    const periodEntries = await this.prisma.generalLedgerEntry.findMany({
      where: {
        accountingEntityId,
        accountId,
        postingDate: { gte: startDate, lte: endDate },
      },
      orderBy: [{ postingDate: 'asc' }, { sequence: 'asc' }],
      include: {
        journalEntry: true,
        fund: true,
        costCenter: true,
      },
    });

    let currentBalance = openingBalance;
    const items: AccountLedgerItem[] = [];

    for (const e of periodEntries) {
      const dr = Number(e.debitAmount);
      const cr = Number(e.creditAmount);
      if (account.normalBalance === 'DEBIT') {
        currentBalance += dr - cr;
      } else {
        currentBalance += cr - dr;
      }

      items.push({
        id: e.id,
        postingDate: e.postingDate.toISOString().split('T')[0] || '',
        journalId: e.journalEntryId,
        journalNumber: e.journalEntry.journalNumber,
        reference: e.journalEntry.reference,
        description: e.journalEntry.description,
        debitAmount: dr,
        creditAmount: cr,
        runningBalance: currentBalance,
        fundName: e.fund?.name,
        costCenterName: e.costCenter?.name,
        sourceModule: e.sourceModule,
      });
    }

    return {
      accountId: account.id,
      accountCode: account.accountCode,
      accountName: account.name,
      accountType: account.accountType,
      normalBalance: account.normalBalance,
      startDate: startDate.toISOString().split('T')[0] || '',
      endDate: endDate.toISOString().split('T')[0] || '',
      openingBalance,
      closingBalance: currentBalance,
      entries: items,
    };
  }
}
