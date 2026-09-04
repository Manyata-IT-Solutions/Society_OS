import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ApIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async reconcileSubledgerWithGl(accountingEntityId: string): Promise<{
    isReconciled: boolean;
    subledgerTotal: number;
    glApControlBalance: number;
    difference: number;
    vendorAccountsChecked: number;
  }> {
    const vendorAccounts = await this.prisma.vendorAccount.findMany({
      where: { accountingEntityId },
    });

    const subledgerTotal = vendorAccounts.reduce((sum, acc) => sum + Number(acc.currentPayable), 0);

    const apControlAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        accountingEntityId,
        OR: [{ systemAccountKey: 'AP_CONTROL' }, { accountCode: '2110' }],
      },
    });

    let glBalance = 0;
    if (apControlAccount) {
      const glEntries = await this.prisma.generalLedgerEntry.findMany({
        where: { accountId: apControlAccount.id },
      });
      // AP Control normal balance is Credit
      glBalance = glEntries.reduce(
        (sum, e) => sum + (Number(e.creditAmount) - Number(e.debitAmount)),
        0,
      );
    }

    const difference = Math.abs(subledgerTotal - glBalance);

    return {
      isReconciled: difference < 0.01,
      subledgerTotal,
      glApControlBalance: glBalance,
      difference,
      vendorAccountsChecked: vendorAccounts.length,
    };
  }
}
