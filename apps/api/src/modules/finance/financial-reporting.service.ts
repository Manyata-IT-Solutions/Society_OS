import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  TrialBalanceReport,
  TrialBalanceRow,
  BalanceSheetReport,
  IncomeExpenditureReport,
  FinancialDashboardKpis,
} from '@community-os/types';

@Injectable()
export class FinancialReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrialBalance(
    accountingEntityId: string,
    asOfDateStr?: string,
  ): Promise<TrialBalanceReport> {
    const entity = await this.prisma.accountingEntity.findUnique({
      where: { id: accountingEntityId },
    });
    if (!entity) throw new NotFoundException('Accounting entity not found');

    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();

    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { accountingEntityId, postingAllowed: true },
      orderBy: { accountCode: 'asc' },
    });

    const entries = await this.prisma.generalLedgerEntry.findMany({
      where: {
        accountingEntityId,
        postingDate: { lte: asOfDate },
      },
    });

    const rows: TrialBalanceRow[] = [];
    let grandClosingDr = 0;
    let grandClosingCr = 0;

    for (const acc of accounts) {
      const accEntries = entries.filter((e) => e.accountId === acc.id);
      let drSum = 0;
      let crSum = 0;

      for (const e of accEntries) {
        drSum += Number(e.debitAmount);
        crSum += Number(e.creditAmount);
      }

      let closingDr = 0;
      let closingCr = 0;

      if (drSum >= crSum) {
        closingDr = drSum - crSum;
      } else {
        closingCr = crSum - drSum;
      }

      grandClosingDr += closingDr;
      grandClosingCr += closingCr;

      rows.push({
        accountId: acc.id,
        accountCode: acc.accountCode,
        accountName: acc.name,
        accountType: acc.accountType,
        normalBalance: acc.normalBalance,
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: drSum,
        periodCredit: crSum,
        closingDebit: closingDr,
        closingCredit: closingCr,
      });
    }

    const diff = Math.abs(grandClosingDr - grandClosingCr);

    return {
      accountingEntityId,
      asOfDate: asOfDate.toISOString().split('T')[0] || '',
      currency: entity.baseCurrency,
      rows,
      totalOpeningDebit: 0,
      totalOpeningCredit: 0,
      totalPeriodDebit: rows.reduce((s, r) => s + r.periodDebit, 0),
      totalPeriodCredit: rows.reduce((s, r) => s + r.periodCredit, 0),
      totalClosingDebit: grandClosingDr,
      totalClosingCredit: grandClosingCr,
      isBalanced: diff < 0.01,
    };
  }

  async getBalanceSheet(
    accountingEntityId: string,
    asOfDateStr?: string,
  ): Promise<BalanceSheetReport> {
    const tb = await this.getTrialBalance(accountingEntityId, asOfDateStr);

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalFundsAndEquity = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    const assetAccounts: any[] = [];
    const liabilityAccounts: any[] = [];
    const fundAccounts: any[] = [];

    for (const row of tb.rows) {
      if (row.accountType === 'ASSET') {
        const amt = row.closingDebit - row.closingCredit;
        totalAssets += amt;
        assetAccounts.push({
          accountId: row.accountId,
          accountCode: row.accountCode,
          accountName: row.accountName,
          amount: amt,
        });
      } else if (row.accountType === 'LIABILITY') {
        const amt = row.closingCredit - row.closingDebit;
        totalLiabilities += amt;
        liabilityAccounts.push({
          accountId: row.accountId,
          accountCode: row.accountCode,
          accountName: row.accountName,
          amount: amt,
        });
      } else if (row.accountType === 'FUND_BALANCE') {
        const amt = row.closingCredit - row.closingDebit;
        totalFundsAndEquity += amt;
        fundAccounts.push({
          accountId: row.accountId,
          accountCode: row.accountCode,
          accountName: row.accountName,
          amount: amt,
        });
      } else if (row.accountType === 'INCOME') {
        totalIncome += row.closingCredit - row.closingDebit;
      } else if (row.accountType === 'EXPENSE') {
        totalExpense += row.closingDebit - row.closingCredit;
      }
    }

    const currentPeriodSurplus = totalIncome - totalExpense;
    const totalLiabilitiesAndEquity = totalLiabilities + totalFundsAndEquity + currentPeriodSurplus;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

    return {
      accountingEntityId,
      asOfDate: tb.asOfDate,
      currency: tb.currency,
      assets: [{ categoryName: 'Current Assets', accounts: assetAccounts, subtotal: totalAssets }],
      totalAssets,
      liabilities: [
        {
          categoryName: 'Current Liabilities',
          accounts: liabilityAccounts,
          subtotal: totalLiabilities,
        },
      ],
      totalLiabilities,
      fundsAndEquity: [
        {
          categoryName: 'Society Funds & Reserves',
          accounts: fundAccounts,
          subtotal: totalFundsAndEquity,
        },
      ],
      totalFundsAndEquity,
      currentPeriodSurplus,
      totalLiabilitiesAndEquity,
      isBalanced,
    };
  }

  async getIncomeExpenditure(
    accountingEntityId: string,
    startDateStr?: string,
    endDateStr?: string,
  ): Promise<IncomeExpenditureReport> {
    const entity = await this.prisma.accountingEntity.findUnique({
      where: { id: accountingEntityId },
    });
    if (!entity) throw new NotFoundException('Accounting entity not found');

    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    const accounts = await this.prisma.ledgerAccount.findMany({
      where: {
        accountingEntityId,
        accountType: { in: ['INCOME', 'EXPENSE'] },
        postingAllowed: true,
      },
      orderBy: { accountCode: 'asc' },
    });

    const entries = await this.prisma.generalLedgerEntry.findMany({
      where: {
        accountingEntityId,
        postingDate: { gte: startDate, lte: endDate },
      },
    });

    const incomeAccounts: any[] = [];
    const expenseAccounts: any[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const acc of accounts) {
      const accEntries = entries.filter((e) => e.accountId === acc.id);
      let dr = 0;
      let cr = 0;
      for (const e of accEntries) {
        dr += Number(e.debitAmount);
        cr += Number(e.creditAmount);
      }

      if (acc.accountType === 'INCOME') {
        const net = cr - dr;
        totalIncome += net;
        incomeAccounts.push({
          accountId: acc.id,
          accountCode: acc.accountCode,
          accountName: acc.name,
          amount: net,
        });
      } else {
        const net = dr - cr;
        totalExpenses += net;
        expenseAccounts.push({
          accountId: acc.id,
          accountCode: acc.accountCode,
          accountName: acc.name,
          amount: net,
        });
      }
    }

    return {
      accountingEntityId,
      startDate: startDate.toISOString().split('T')[0] || '',
      endDate: endDate.toISOString().split('T')[0] || '',
      currency: entity.baseCurrency,
      income: [
        {
          categoryName: 'Operational & Maintenance Revenue',
          accounts: incomeAccounts,
          subtotal: totalIncome,
        },
      ],
      totalIncome,
      expenses: [
        {
          categoryName: 'Society Operational Expenses',
          accounts: expenseAccounts,
          subtotal: totalExpenses,
        },
      ],
      totalExpenses,
      netSurplusOrDeficit: totalIncome - totalExpenses,
    };
  }

  async getDashboardKpis(accountingEntityId: string): Promise<FinancialDashboardKpis> {
    const tb = await this.getTrialBalance(accountingEntityId);
    const ie = await this.getIncomeExpenditure(accountingEntityId);

    // Calculate Cash & Bank from 1100 series
    let cashBank = 0;
    for (const r of tb.rows) {
      if (r.accountCode.startsWith('11')) {
        cashBank += r.closingDebit - r.closingCredit;
      }
    }

    const unposted = await this.prisma.journalEntry.count({
      where: { accountingEntityId, status: { in: ['DRAFT', 'SUBMITTED'] } },
    });

    const pendingApprovals = await this.prisma.journalEntry.count({
      where: { accountingEntityId, status: 'SUBMITTED' },
    });

    const activeFunds = await this.prisma.fund.count({
      where: { accountingEntityId, status: 'ACTIVE' },
    });

    return {
      cashAndBankBalance: cashBank,
      currentPeriodIncome: ie.totalIncome,
      currentPeriodExpense: ie.totalExpenses,
      currentPeriodSurplus: ie.netSurplusOrDeficit,
      activeFundsCount: activeFunds,
      unpostedJournalsCount: unposted,
      pendingApprovalsCount: pendingApprovals,
      currentPeriodName: new Date().toISOString().slice(0, 7),
      currentPeriodStatus: 'OPEN',
    };
  }
}
