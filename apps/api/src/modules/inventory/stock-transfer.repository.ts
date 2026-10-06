import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class StockTransferRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.StockTransferCreateInput, tx?: Prisma.TransactionClient): Promise<any> {
    const client = tx ?? this.prisma;
    return client.stockTransfer.create({
      data,
      include: {
        sourceStore: true,
        destinationStore: true,
        lines: {
          include: {
            item: { include: { baseUom: true } },
            uom: true,
            sourceBin: true,
            destinationBin: true,
            batch: true,
          },
        },
        dispatchedByUser: true,
        receivedByUser: true,
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<any> {
    const client = tx ?? this.prisma;
    return client.stockTransfer.findUnique({
      where: { id },
      include: {
        sourceStore: true,
        destinationStore: true,
        lines: {
          include: {
            item: { include: { baseUom: true } },
            uom: true,
            sourceBin: true,
            destinationBin: true,
            batch: true,
          },
        },
        dispatchedByUser: true,
        receivedByUser: true,
      },
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    sourceStoreId?: string;
    destinationStoreId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<{ transfers: any[]; total: number }> {
    const where: Prisma.StockTransferWhereInput = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.communityId ? { communityId: params.communityId } : {}),
      ...(params.sourceStoreId ? { sourceStoreId: params.sourceStoreId } : {}),
      ...(params.destinationStoreId ? { destinationStoreId: params.destinationStoreId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [transfers, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        include: {
          sourceStore: true,
          destinationStore: true,
          lines: { include: { item: { include: { baseUom: true } }, uom: true } },
          dispatchedByUser: true,
          receivedByUser: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    return { transfers, total };
  }

  async update(
    id: string,
    data: Prisma.StockTransferUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    const client = tx ?? this.prisma;
    return client.stockTransfer.update({
      where: { id },
      data,
      include: {
        sourceStore: true,
        destinationStore: true,
        lines: {
          include: {
            item: { include: { baseUom: true } },
            uom: true,
            sourceBin: true,
            destinationBin: true,
            batch: true,
          },
        },
        dispatchedByUser: true,
        receivedByUser: true,
      },
    });
  }
}
