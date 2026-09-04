import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, InventoryReceipt } from '@prisma/client';

@Injectable()
export class InventoryReceiptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.InventoryReceiptCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<InventoryReceipt> {
    const client = tx ?? this.prisma;
    return client.inventoryReceipt.create({
      data,
      include: {
        store: true,
        lines: {
          include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
        },
        receivedByUser: true,
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<InventoryReceipt | null> {
    const client = tx ?? this.prisma;
    return client.inventoryReceipt.findUnique({
      where: { id },
      include: {
        store: true,
        lines: {
          include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
        },
        receivedByUser: true,
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
  }): Promise<{ receipts: InventoryReceipt[]; total: number }> {
    const where: Prisma.InventoryReceiptWhereInput = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.communityId ? { communityId: params.communityId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [receipts, total] = await Promise.all([
      this.prisma.inventoryReceipt.findMany({
        where,
        include: {
          store: true,
          lines: { include: { item: { include: { baseUom: true } }, uom: true, bin: true } },
          receivedByUser: true,
        },
        orderBy: { receivedAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.inventoryReceipt.count({ where }),
    ]);

    return { receipts, total };
  }

  async update(
    id: string,
    data: Prisma.InventoryReceiptUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<InventoryReceipt> {
    const client = tx ?? this.prisma;
    return client.inventoryReceipt.update({
      where: { id },
      data,
      include: {
        store: true,
        lines: {
          include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
        },
        receivedByUser: true,
      },
    });
  }
}
