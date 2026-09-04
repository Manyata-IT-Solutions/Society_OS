import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { VendorLedgerEntry, VendorLedgerEntryType } from '@prisma/client';

@Injectable()
export class VendorSubledgerService {
  constructor(private readonly prisma: PrismaService) {}

  async postEntry(params: {
    vendorAccountId: string;
    entryDate?: Date;
    entryType: VendorLedgerEntryType;
    referenceType: string;
    referenceId: string;
    debit: number;
    credit: number;
    currency?: string;
    description: string;
    postingJournalId?: string;
  }): Promise<VendorLedgerEntry> {
    const account = await this.prisma.vendorAccount.findUnique({
      where: { id: params.vendorAccountId },
    });
    if (!account) throw new Error('Vendor account not found');

    const lastEntry = await this.prisma.vendorLedgerEntry.findFirst({
      where: { vendorAccountId: params.vendorAccountId },
      orderBy: { createdAt: 'desc' },
    });

    const previousBalance = lastEntry
      ? Number(lastEntry.runningBalance)
      : Number(account.currentPayable);
    // For Vendor (Liability): Credit increases payable, Debit decreases payable
    const runningBalance = previousBalance + params.credit - params.debit;

    const entry = await this.prisma.vendorLedgerEntry.create({
      data: {
        vendorAccount: { connect: { id: params.vendorAccountId } },
        entryDate: params.entryDate || new Date(),
        entryType: params.entryType,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        debit: params.debit,
        credit: params.credit,
        runningBalance,
        currency: params.currency || account.currency || 'INR',
        description: params.description,
        postingJournalId: params.postingJournalId,
      },
    });

    await this.prisma.vendorAccount.update({
      where: { id: params.vendorAccountId },
      data: {
        currentPayable: runningBalance,
        lastInvoiceDate:
          params.entryType === 'SUPPLIER_INVOICE' ? params.entryDate || new Date() : undefined,
        lastPaymentDate:
          params.entryType === 'PAYMENT' ? params.entryDate || new Date() : undefined,
      },
    });

    return entry;
  }

  async getStatement(
    vendorAccountId: string,
    options?: { startDate?: Date; endDate?: Date },
  ): Promise<VendorLedgerEntry[]> {
    return this.prisma.vendorLedgerEntry.findMany({
      where: {
        vendorAccountId,
        entryDate: {
          gte: options?.startDate,
          lte: options?.endDate,
        },
      },
      orderBy: { entryDate: 'asc' },
    });
  }
}
