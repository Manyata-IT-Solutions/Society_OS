import { Injectable, BadRequestException } from '@nestjs/common';
import { StockBalanceRepository } from './stock-balance.repository.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class StockBalanceService {
  constructor(private readonly balanceRepo: StockBalanceRepository) {}

  async applyDelta(
    params: {
      organizationId: string;
      communityId?: string | null;
      storeId: string;
      binId?: string | null;
      itemId: string;
      batchId?: string | null;
      onHandDelta: number;
      reservedDelta: number;
      allowNegative?: boolean;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const current = await this.balanceRepo.findBalance(
      params.storeId,
      params.itemId,
      params.binId,
      params.batchId,
      tx,
    );

    const prevOnHand = current ? Number(current.quantityOnHand) : 0;
    const prevReserved = current ? Number(current.quantityReserved) : 0;

    const newOnHand = prevOnHand + params.onHandDelta;
    const newReserved = prevReserved + params.reservedDelta;
    const newAvailable = newOnHand - newReserved;

    if (!params.allowNegative && newOnHand < 0) {
      throw new BadRequestException(
        `Insufficient stock on-hand for item '${params.itemId}' in store '${params.storeId}'. Current: ${prevOnHand}, Requested deduction: ${Math.abs(params.onHandDelta)}`,
      );
    }

    if (!params.allowNegative && newAvailable < 0) {
      throw new BadRequestException(
        `Insufficient stock available for item '${params.itemId}' in store '${params.storeId}'. Available: ${prevOnHand - prevReserved}, Requested: ${Math.abs(params.onHandDelta || params.reservedDelta)}`,
      );
    }

    const updated = await this.balanceRepo.upsertBalance(
      {
        storeId: params.storeId,
        itemId: params.itemId,
        binId: params.binId,
        batchId: params.batchId,
        quantityOnHand: newOnHand,
        quantityReserved: newReserved,
        quantityAvailable: newAvailable,
      },
      tx,
    );

    return updated;
  }

  async getBalances(params: {
    storeId?: string;
    itemId?: string;
    categoryId?: string;
    lowStockOnly?: boolean;
    skip?: number;
    take?: number;
  }) {
    return this.balanceRepo.findBalances(params);
  }

  async getMetrics(_organizationId: string, _communityId?: string) {
    return this.getKpiMetrics(_organizationId, _communityId);
  }

  async getKpiMetrics(_organizationId: string, _communityId?: string) {
    // Collect active items count, low stock count, etc.
    return {
      totalItems: 0,
      activeItems: 0,
      stockedItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalStores: 0,
      reservedItemsCount: 0,
      expiringBatchesCount: 0,
      pendingMaterialRequests: 0,
      pendingReceipts: 0,
      pendingIssues: 0,
    };
  }
}
