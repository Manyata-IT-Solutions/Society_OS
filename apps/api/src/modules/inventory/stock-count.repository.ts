import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class StockCountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.StockCountCreateInput, tx?: Prisma.TransactionClient): Promise<any> {
    const client = tx ?? this.prisma;
    return client.stockCount.create({
      data,
      include: {
        store: true,
        lines: {
          include: {
            item: { include: { baseUom: true } },
            uom: true,
            bin: true,
            batch: true,
            countedByUser: true,
          },
        },
        submittedByUser: true,
        reviewedByUser: true,
        postedByUser: true,
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<any> {
    const client = tx ?? this.prisma;
    return client.stockCount.findUnique({
      where: { id },
      include: {
        store: true,
        lines: {
          include: {
            item: { include: { baseUom: true } },
            uom: true,
            bin: true,
            batch: true,
            countedByUser: true,
          },
        },
        submittedByUser: true,
        reviewedByUser: true,
        postedByUser: true,
      },
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<{ counts: any[]; total: number }> {
    const where: Prisma.StockCountWhereInput = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.communityId ? { communityId: params.communityId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [counts, total] = await Promise.all([
      this.prisma.stockCount.findMany({
        where,
        include: {
          store: true,
          lines: { include: { item: { include: { baseUom: true } }, uom: true } },
          submittedByUser: true,
          postedByUser: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.stockCount.count({ where }),
    ]);

    return { counts, total };
  }
}
