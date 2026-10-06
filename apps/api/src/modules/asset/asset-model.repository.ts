import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, AssetModel } from '@prisma/client';

@Injectable()
export class AssetModelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AssetModelCreateInput): Promise<AssetModel> {
    return this.prisma.assetModel.create({
      data,
      include: { category: true },
    });
  }

  async findById(id: string): Promise<AssetModel | null> {
    return this.prisma.assetModel.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async findMany(filters: {
    organizationId: string;
    communityId?: string | null;
    categoryId?: string;
    manufacturer?: string;
    status?: 'ACTIVE' | 'ARCHIVED';
    search?: string;
  }): Promise<AssetModel[]> {
    const where: Prisma.AssetModelWhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.communityId !== undefined) {
      where.OR = [{ communityId: filters.communityId }, { communityId: null }];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.manufacturer)
      where.manufacturer = { contains: filters.manufacturer, mode: 'insensitive' };
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { modelName: { contains: filters.search, mode: 'insensitive' } },
        { modelNumber: { contains: filters.search, mode: 'insensitive' } },
        { manufacturer: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.assetModel.findMany({
      where,
      orderBy: { modelName: 'asc' },
      include: { category: true },
    });
  }

  async update(id: string, data: Prisma.AssetModelUpdateInput): Promise<AssetModel> {
    return this.prisma.assetModel.update({
      where: { id },
      data,
      include: { category: true },
    });
  }
}
