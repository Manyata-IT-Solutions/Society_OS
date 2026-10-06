import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, StockLedgerEntry } from '@prisma/client';

@Injectable()
export class StockLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEntry(
    data: Prisma.StockLedgerEntryCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<StockLedgerEntry> {
    const client = tx ?? this.prisma;
    return client.stockLedgerEntry.create({
      data,
      include: {
        store: true,
        bin: true,
        item: true,
        batch: true,
        serial: true,
        createdByUser: true,
      },
    });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<StockLedgerEntry | null> {
    return this.prisma.stockLedgerEntry.findUnique({
      where: { idempotencyKey },
      include: {
        store: true,
        bin: true,
        item: true,
        batch: true,
        serial: true,
      },
    });
  }

  async findLedgerEntries(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    itemId?: string;
    transactionType?: any;
    fromDate?: Date;
    toDate?: Date;
    skip?: number;
    take?: number;
  }): Promise<{ entries: StockLedgerEntry[]; total: number }> {
    const where: Prisma.StockLedgerEntryWhereInput = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.communityId ? { communityId: params.communityId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.transactionType ? { transactionType: params.transactionType } : {}),
      ...(params.fromDate || params.toDate
        ? {
            occurredAt: {
              ...(params.fromDate ? { gte: params.fromDate } : {}),
              ...(params.toDate ? { lte: params.toDate } : {}),
            },
          }
        : {}),
    };

    const [entries, total] = await Promise.all([
      this.prisma.stockLedgerEntry.findMany({
        where,
        include: {
          store: true,
          bin: true,
          item: true,
          batch: true,
          serial: true,
          createdByUser: true,
        },
        orderBy: { occurredAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.stockLedgerEntry.count({ where }),
    ]);

    return { entries, total };
  }
}
