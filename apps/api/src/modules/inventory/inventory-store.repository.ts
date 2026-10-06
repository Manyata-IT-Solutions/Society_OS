import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, InventoryStore, StockBin } from '@prisma/client';

@Injectable()
export class InventoryStoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStore(data: Prisma.InventoryStoreCreateInput): Promise<InventoryStore> {
    return this.prisma.inventoryStore.create({
      data,
      include: {
        managerUser: true,
        propertySection: true,
        building: true,
        _count: { select: { bins: true, balances: true } },
      },
    });
  }

  async findStoreById(id: string): Promise<InventoryStore | null> {
    return this.prisma.inventoryStore.findUnique({
      where: { id },
      include: {
        managerUser: true,
        propertySection: true,
        building: true,
        bins: true,
        _count: { select: { bins: true, balances: true } },
      },
    });
  }

  async findStoreByCode(
    organizationId: string,
    communityId: string | null,
    code: string,
  ): Promise<InventoryStore | null> {
    return this.prisma.inventoryStore.findFirst({
      where: {
        organizationId,
        communityId: communityId ?? null,
        code,
      },
    });
  }

  async findAllStores(organizationId: string, communityId?: string): Promise<InventoryStore[]> {
    return this.prisma.inventoryStore.findMany({
      where: {
        organizationId,
        ...(communityId ? { communityId } : {}),
      },
      include: {
        managerUser: true,
        propertySection: true,
        building: true,
        _count: { select: { bins: true, balances: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createBin(data: Prisma.StockBinCreateInput): Promise<StockBin> {
    return this.prisma.stockBin.create({
      data,
      include: { store: true },
    });
  }

  async findBinById(id: string): Promise<StockBin | null> {
    return this.prisma.stockBin.findUnique({
      where: { id },
      include: { store: true },
    });
  }

  async findAllBins(storeId: string): Promise<StockBin[]> {
    return this.prisma.stockBin.findMany({
      where: { storeId },
      include: { store: true },
      orderBy: { code: 'asc' },
    });
  }
}
