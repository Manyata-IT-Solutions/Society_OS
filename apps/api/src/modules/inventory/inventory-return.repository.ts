import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, InventoryReturn } from '@prisma/client';

@Injectable()
export class InventoryReturnRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.InventoryReturnCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<InventoryReturn> {
    const client = tx ?? this.prisma;
    return client.inventoryReturn.create({
      data,
      include: {
        store: true,
        lines: {
          include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
        },
        returnedByUser: true,
        receivedByUser: true,
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<InventoryReturn | null> {
    const client = tx ?? this.prisma;
    return client.inventoryReturn.findUnique({
      where: { id },
      include: {
        store: true,
        lines: {
          include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
        },
        returnedByUser: true,
        receivedByUser: true,
      },
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    workOrderId?: string;
    skip?: number;
    take?: number;
  }): Promise<{ returns: InventoryReturn[]; total: number }> {
    const where: Prisma.InventoryReturnWhereInput = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.communityId ? { communityId: params.communityId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.workOrderId ? { workOrderId: params.workOrderId } : {}),
    };

    const [returns, total] = await Promise.all([
      this.prisma.inventoryReturn.findMany({
        where,
        include: {
          store: true,
          lines: { include: { item: { include: { baseUom: true } }, uom: true, bin: true } },
          returnedByUser: true,
          receivedByUser: true,
        },
        orderBy: { returnedAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.inventoryReturn.count({ where }),
    ]);

    return { returns, total };
  }
}
