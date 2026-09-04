import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, InventoryBatch } from '@prisma/client';

@Injectable()
export class InventoryBatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.InventoryBatchCreateInput): Promise<InventoryBatch> {
    return this.prisma.inventoryBatch.create({
      data,
      include: { item: true, balances: true },
    });
  }

  async findById(id: string): Promise<InventoryBatch | null> {
    return this.prisma.inventoryBatch.findUnique({
      where: { id },
      include: { item: true, balances: { include: { store: true } } },
    });
  }

  async findAll(params: {
    itemId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<{ batches: InventoryBatch[]; total: number }> {
    const where: Prisma.InventoryBatchWhereInput = {
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [batches, total] = await Promise.all([
      this.prisma.inventoryBatch.findMany({
        where,
        include: { item: true, balances: { include: { store: true } } },
        orderBy: { expiryAt: 'asc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.inventoryBatch.count({ where }),
    ]);

    return { batches, total };
  }

  async findExpiringBatches(daysThreshold = 30): Promise<InventoryBatch[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return this.prisma.inventoryBatch.findMany({
      where: {
        expiryAt: { lte: thresholdDate },
        status: 'ACTIVE',
      },
      include: { item: true },
    });
  }
}
