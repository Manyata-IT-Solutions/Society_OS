import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, StockBalance } from '@prisma/client';

@Injectable()
export class StockBalanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBalance(
    storeId: string,
    itemId: string,
    binId?: string | null,
    batchId?: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<StockBalance | null> {
    const client = tx ?? this.prisma;
    return client.stockBalance.findFirst({
      where: {
        storeId,
        itemId,
        binId: binId ?? null,
        batchId: batchId ?? null,
      },
      include: {
        store: true,
        bin: true,
        item: true,
        batch: true,
      },
    });
  }

  async upsertBalance(
    data: {
      storeId: string;
      itemId: string;
      binId?: string | null;
      batchId?: string | null;
      quantityOnHand: number;
      quantityReserved: number;
      quantityAvailable: number;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<StockBalance> {
    const client = tx ?? this.prisma;
    const existing = await client.stockBalance.findFirst({
      where: {
        storeId: data.storeId,
        itemId: data.itemId,
        binId: data.binId ?? null,
        batchId: data.batchId ?? null,
      },
    });

    if (existing) {
      return client.stockBalance.update({
        where: { id: existing.id },
        data: {
          quantityOnHand: data.quantityOnHand,
          quantityReserved: data.quantityReserved,
          quantityAvailable: data.quantityAvailable,
          lastMovementAt: new Date(),
          version: { increment: 1 },
        },
        include: {
          store: true,
          bin: true,
          item: true,
          batch: true,
        },
      });
    }

    return client.stockBalance.create({
      data: {
        storeId: data.storeId,
        binId: data.binId ?? null,
        itemId: data.itemId,
        batchId: data.batchId ?? null,
        quantityOnHand: data.quantityOnHand,
        quantityReserved: data.quantityReserved,
        quantityAvailable: data.quantityAvailable,
        lastMovementAt: new Date(),
        version: 1,
      },
      include: {
        store: true,
        bin: true,
        item: true,
        batch: true,
      },
    });
  }

  async findBalances(params: {
    storeId?: string;
    itemId?: string;
    categoryId?: string;
    lowStockOnly?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ balances: StockBalance[]; total: number }> {
    const where: Prisma.StockBalanceWhereInput = {
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.categoryId ? { item: { categoryId: params.categoryId } } : {}),
    };

    const [balances, total] = await Promise.all([
      this.prisma.stockBalance.findMany({
        where,
        include: {
          store: true,
          bin: true,
          item: { include: { baseUom: true, category: true } },
          batch: true,
        },
        orderBy: [{ storeId: 'asc' }, { itemId: 'asc' }],
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.stockBalance.count({ where }),
    ]);

    return { balances, total };
  }

  async getTotalAvailableForItem(itemId: string, storeId?: string): Promise<number> {
    const balances = await this.prisma.stockBalance.findMany({
      where: {
        itemId,
        ...(storeId ? { storeId } : {}),
      },
    });
    return balances.reduce((sum, b) => sum + Number(b.quantityAvailable), 0);
  }
}
