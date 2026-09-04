import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, InventorySerial } from '@prisma/client';

@Injectable()
export class InventorySerialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.InventorySerialCreateInput): Promise<InventorySerial> {
    return this.prisma.inventorySerial.create({
      data,
      include: {
        item: true,
        currentStore: true,
        currentBin: true,
        currentWorkOrder: true,
        batch: true,
      },
    });
  }

  async findById(id: string): Promise<InventorySerial | null> {
    return this.prisma.inventorySerial.findUnique({
      where: { id },
      include: {
        item: true,
        currentStore: true,
        currentBin: true,
        currentWorkOrder: true,
        batch: true,
      },
    });
  }

  async findAll(params: {
    itemId?: string;
    currentStoreId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<{ serials: InventorySerial[]; total: number }> {
    const where: Prisma.InventorySerialWhereInput = {
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.currentStoreId ? { currentStoreId: params.currentStoreId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [serials, total] = await Promise.all([
      this.prisma.inventorySerial.findMany({
        where,
        include: {
          item: true,
          currentStore: true,
          currentBin: true,
          currentWorkOrder: true,
          batch: true,
        },
        orderBy: { serialNumber: 'asc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.inventorySerial.count({ where }),
    ]);

    return { serials, total };
  }

  async update(id: string, data: Prisma.InventorySerialUpdateInput): Promise<InventorySerial> {
    return this.prisma.inventorySerial.update({
      where: { id },
      data,
      include: {
        item: true,
        currentStore: true,
        currentBin: true,
        currentWorkOrder: true,
        batch: true,
      },
    });
  }
}
