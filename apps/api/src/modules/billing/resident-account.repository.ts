import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, ResidentAccount, ResidentLedgerEntry, ResidentOutstanding } from '@prisma/client';

@Injectable()
export class ResidentAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: Prisma.ResidentAccountCreateInput): Promise<ResidentAccount> {
    const billableAccountId = data.billableAccount.connect?.id;
    if (!billableAccountId) {
      throw new BadRequestException('billableAccount.connect.id is required');
    }

    return this.prisma.residentAccount.upsert({
      where: { billableAccountId },
      update: {},
      create: data,
      include: { outstanding: true },
    });
  }

  async findByBillableAccountId(billableAccountId: string): Promise<ResidentAccount | null> {
    return this.prisma.residentAccount.findUnique({
      where: { billableAccountId },
      include: { outstanding: true },
    });
  }

  async addLedgerEntry(data: Prisma.ResidentLedgerEntryCreateInput): Promise<ResidentLedgerEntry> {
    return this.prisma.residentLedgerEntry.create({ data });
  }

  async listLedgerEntries(params: {
    residentAccountId: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }): Promise<[ResidentLedgerEntry[], number]> {
    const where: Prisma.ResidentLedgerEntryWhereInput = {
      residentAccountId: params.residentAccountId,
      ...(params.startDate || params.endDate
        ? {
            entryDate: {
              ...(params.startDate ? { gte: params.startDate } : {}),
              ...(params.endDate ? { lte: params.endDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.residentLedgerEntry.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { entryDate: 'desc' },
      }),
      this.prisma.residentLedgerEntry.count({ where }),
    ]);

    return [items, total];
  }

  async upsertOutstanding(
    data: Prisma.ResidentOutstandingCreateInput,
  ): Promise<ResidentOutstanding> {
    const accId = data.residentAccount.connect?.id || (data as any).residentAccountId;
    return this.prisma.residentOutstanding.upsert({
      where: { residentAccountId: accId },
      update: {
        currentDue: data.currentDue,
        overdue: data.overdue,
        advanceCredit: data.advanceCredit,
        totalOutstanding: data.totalOutstanding,
        bucket0To30: data.bucket0To30,
        bucket31To60: data.bucket31To60,
        bucket61To90: data.bucket61To90,
        bucket91Plus: data.bucket91Plus,
        lastInvoiceDate: data.lastInvoiceDate,
        lastPaymentDate: data.lastPaymentDate,
        collectionStatus: data.collectionStatus,
      },
      create: data,
    });
  }
}
