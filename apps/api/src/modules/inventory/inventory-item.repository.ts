import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, InventoryItem, ItemStorePolicy } from '@prisma/client';

@Injectable()
export class InventoryItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.InventoryItemCreateInput): Promise<InventoryItem> {
    return this.prisma.inventoryItem.create({
      data,
      include: {
        category: true,
        baseUom: true,
        defaultIssueUom: true,
        preferredStore: true,
        preferredBin: true,
        storePolicies: { include: { store: true, defaultBin: true } },
        balances: true,
      },
    });
  }

  async findById(id: string): Promise<InventoryItem | null> {
    return this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
        baseUom: true,
        defaultIssueUom: true,
        preferredStore: true,
        preferredBin: true,
        storePolicies: { include: { store: true, defaultBin: true } },
        balances: { include: { store: true, bin: true, batch: true } },
        batches: true,
        serials: true,
      },
    });
  }

  async findByCode(
    organizationId: string,
    communityId: string | null,
    itemCode: string,
  ): Promise<InventoryItem | null> {
    return this.prisma.inventoryItem.findFirst({
      where: {
        organizationId,
        communityId: communityId ?? null,
        itemCode,
      },
      include: {
        category: true,
        baseUom: true,
        balances: true,
      },
    });
  }

  async findByIdentifier(identifier: string): Promise<InventoryItem | null> {
    return this.prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { barcodeIdentifier: identifier },
          { qrIdentifier: identifier },
          { itemCode: identifier },
        ],
      },
      include: {
        category: true,
        baseUom: true,
        preferredStore: true,
        balances: { include: { store: true } },
      },
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    categoryId?: string;
    itemType?: any;
    status?: any;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: InventoryItem[]; total: number }> {
    const where: Prisma.InventoryItemWhereInput = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.communityId ? { communityId: params.communityId } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.itemType ? { itemType: params.itemType } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { itemCode: { contains: params.search, mode: 'insensitive' } },
              { barcodeIdentifier: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        include: {
          category: true,
          baseUom: true,
          defaultIssueUom: true,
          preferredStore: true,
          preferredBin: true,
          balances: true,
        },
        orderBy: { name: 'asc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, data: Prisma.InventoryItemUpdateInput): Promise<InventoryItem> {
    return this.prisma.inventoryItem.update({
      where: { id },
      data,
      include: {
        category: true,
        baseUom: true,
        defaultIssueUom: true,
        preferredStore: true,
        preferredBin: true,
        storePolicies: { include: { store: true, defaultBin: true } },
        balances: true,
      },
    });
  }

  async upsertStorePolicy(
    itemId: string,
    storeId: string,
    data: {
      minQuantity: number;
      reorderLevel: number;
      reorderQuantity: number;
      maxQuantity?: number | null;
      defaultBinId?: string | null;
      reorderEnabled?: boolean;
    },
  ): Promise<ItemStorePolicy> {
    return this.prisma.itemStorePolicy.upsert({
      where: {
        itemId_storeId: { itemId, storeId },
      },
      update: {
        minQuantity: data.minQuantity,
        reorderLevel: data.reorderLevel,
        reorderQuantity: data.reorderQuantity,
        maxQuantity: data.maxQuantity ?? null,
        defaultBinId: data.defaultBinId ?? null,
        reorderEnabled: data.reorderEnabled ?? true,
      },
      create: {
        itemId,
        storeId,
        minQuantity: data.minQuantity,
        reorderLevel: data.reorderLevel,
        reorderQuantity: data.reorderQuantity,
        maxQuantity: data.maxQuantity ?? null,
        defaultBinId: data.defaultBinId ?? null,
        reorderEnabled: data.reorderEnabled ?? true,
      },
      include: {
        store: true,
        defaultBin: true,
      },
    });
  }
}
