import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class TreasuryDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(accountingEntityId: string): Promise<{
    bookBankBalancesTotal: number;
    paymentsAwaitingApproval: number;
    unreconciledTransactionsCount: number;
    recentPaymentsTotal: number;
    bankAccounts: Array<{
      id: string;
      name: string;
      bankName: string;
      maskedNumber: string;
      bookBalance: number;
      unmatchedCount: number;
    }>;
  }> {
    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { accountingEntityId, status: 'ACTIVE' },
    });

    let totalBookBalance = 0;
    const accountSummaries = [];

    for (const acc of bankAccounts) {
      const glEntries = await this.prisma.generalLedgerEntry.findMany({
        where: { accountId: acc.glAccountId },
      });
      const bookBal = glEntries.reduce(
        (sum, e) => sum + (Number(e.debitAmount) - Number(e.creditAmount)),
        0,
      );
      totalBookBalance += bookBal;

      const unmatchedCount = await this.prisma.bankTransaction.count({
        where: { bankAccountId: acc.id, status: 'UNMATCHED' },
      });

      accountSummaries.push({
        id: acc.id,
        name: acc.name,
        bankName: acc.bankName,
        maskedNumber: acc.maskedAccountNumber,
        bookBalance: bookBal,
        unmatchedCount,
      });
    }

    const paymentsAwaitingApproval = await this.prisma.paymentRun.count({
      where: { accountingEntityId, status: 'PROPOSED' },
    });

    const unreconciledTransactionsCount = await this.prisma.bankTransaction.count({
      where: { bankAccount: { accountingEntityId }, status: 'UNMATCHED' },
    });

    const recentPayments = await this.prisma.vendorPayment.findMany({
      where: { accountingEntityId, status: 'SUCCESS' },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });
    const recentPaymentsTotal = recentPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      bookBankBalancesTotal: totalBookBalance,
      paymentsAwaitingApproval,
      unreconciledTransactionsCount,
      recentPaymentsTotal,
      bankAccounts: accountSummaries,
    };
  }
}
