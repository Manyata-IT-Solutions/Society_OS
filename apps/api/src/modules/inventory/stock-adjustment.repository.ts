import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, StockAdjustment } from '@prisma/client';

@Injectable()
export class StockAdjustmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.StockAdjustmentCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<StockAdjustment> {
    const client = tx ?? this.prisma;
    return client.stockAdjustment.create({
      data,
      include: {
        store: true,
        lines: {
          include: {
            item: { include: { baseUom: true } },
            uom: true,
            bin: true,
            batch: true,
            serial: true,
          },
        },
        requestedByUser: true,
        approvedByUser: true,
        postedByUser: true,
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<StockAdjustment | null> {
    const client = tx ?? this.prisma;
    return client.stockAdjustment.findUnique({
      where: { id },
      include: {
        store: true,
        lines: {
          include: {
            item: { include: { baseUom: true } },
            uom: true,
            bin: true,
            batch: true,
            serial: true,
          },
        },
        requestedByUser: true,
        approvedByUser: true,
        postedByUser: true,
      },
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    reason?: any;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<{ adjustments: StockAdjustment[]; total: number }> {
    const where: Prisma.StockAdjustmentWhereInput = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.communityId ? { communityId: params.communityId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.reason ? { reason: params.reason } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [adjustments, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        include: {
          store: true,
          lines: { include: { item: { include: { baseUom: true } }, uom: true, bin: true } },
          requestedByUser: true,
          postedByUser: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);

    return { adjustments, total };
  }
}
