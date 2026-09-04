import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ResidentAccountRepository } from './resident-account.repository.js';
import { ResidentLedgerEntry, ResidentLedgerEntryType } from '@prisma/client';

@Injectable()
export class ResidentLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountRepo: ResidentAccountRepository,
  ) {}

  async postEntry(params: {
    billableAccountId: string;
    entryDate: Date;
    entryType: ResidentLedgerEntryType;
    referenceType: string;
    referenceId: string;
    debit: number;
    credit: number;
    description: string;
  }): Promise<ResidentLedgerEntry> {
    let residentAccount = await this.prisma.residentAccount.findUnique({
      where: { billableAccountId: params.billableAccountId },
    });

    if (!residentAccount) {
      residentAccount = await this.prisma.residentAccount.create({
        data: {
          billableAccount: { connect: { id: params.billableAccountId } },
          accountNumber: `RA-${params.billableAccountId.slice(0, 8)}`,
          openingBalance: 0,
          currentBalance: 0,
        },
      });
    }

    const currentBalance = Number(residentAccount.currentBalance);
    const newBalance = currentBalance + params.debit - params.credit;

    // Update account balances
    await this.prisma.residentAccount.update({
      where: { id: residentAccount.id },
      data: {
        currentBalance: newBalance,
        totalInvoiced: { increment: params.debit },
        totalPaid: { increment: params.credit },
      },
    });

    // Create append-only ledger entry
    const entry = await this.accountRepo.addLedgerEntry({
      residentAccount: { connect: { id: residentAccount.id } },
      entryDate: params.entryDate,
      entryType: params.entryType,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      debit: params.debit,
      credit: params.credit,
      runningBalance: newBalance,
      description: params.description,
      sourceModule: 'BILLING',
    });

    // Update outstanding projection
    await this.updateOutstandingProjection(residentAccount.id);

    return entry;
  }

  async updateOutstandingProjection(residentAccountId: string): Promise<void> {
    const account = await this.prisma.residentAccount.findUnique({
      where: { id: residentAccountId },
      include: {
        billableAccount: {
          include: {
            invoices: { where: { status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } } },
          },
        },
      },
    });

    if (!account) return;

    const invoices = account.billableAccount.invoices;
    const now = new Date();

    let currentDue = 0;
    let overdue = 0;
    let bucket0To30 = 0;
    let bucket31To60 = 0;
    let bucket61To90 = 0;
    let bucket91Plus = 0;

    for (const inv of invoices) {
      const outstanding = Number(inv.outstandingAmount);
      const dueDate = new Date(inv.dueDate);
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 0) {
        currentDue += outstanding;
      } else {
        overdue += outstanding;
        if (diffDays <= 30) bucket0To30 += outstanding;
        else if (diffDays <= 60) bucket31To60 += outstanding;
        else if (diffDays <= 90) bucket61To90 += outstanding;
        else bucket91Plus += outstanding;
      }
    }

    const totalOutstanding = currentDue + overdue;
    const collectionStatus = overdue > 0 ? 'OVERDUE' : totalOutstanding > 0 ? 'DUE' : 'CURRENT';

    await this.accountRepo.upsertOutstanding({
      residentAccount: { connect: { id: residentAccountId } },
      currentDue,
      overdue,
      advanceCredit: Number(account.advanceCredit),
      totalOutstanding,
      bucket0To30,
      bucket31To60,
      bucket61To90,
      bucket91Plus,
      collectionStatus,
    });
  }
}
