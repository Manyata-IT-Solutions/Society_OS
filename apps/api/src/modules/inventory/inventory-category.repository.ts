import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, InventoryCategory } from '@prisma/client';

@Injectable()
export class InventoryCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.InventoryCategoryCreateInput): Promise<InventoryCategory> {
    return this.prisma.inventoryCategory.create({
      data,
      include: { parent: true, _count: { select: { items: true } } },
    });
  }

  async findById(id: string): Promise<InventoryCategory | null> {
    return this.prisma.inventoryCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: { select: { items: true } },
      },
    });
  }

  async findByCode(
    organizationId: string,
    communityId: string | null,
    code: string,
  ): Promise<InventoryCategory | null> {
    return this.prisma.inventoryCategory.findFirst({
      where: {
        organizationId,
        communityId: communityId ?? null,
        code,
      },
    });
  }

  async findAll(organizationId: string, communityId?: string): Promise<InventoryCategory[]> {
    return this.prisma.inventoryCategory.findMany({
      where: {
        organizationId,
        ...(communityId ? { communityId } : {}),
      },
      include: {
        parent: true,
        _count: { select: { items: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, data: Prisma.InventoryCategoryUpdateInput): Promise<InventoryCategory> {
    return this.prisma.inventoryCategory.update({
      where: { id },
      data,
      include: { parent: true, _count: { select: { items: true } } },
    });
  }
}
