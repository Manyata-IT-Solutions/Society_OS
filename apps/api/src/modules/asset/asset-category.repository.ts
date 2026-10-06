import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, AssetCategory } from '@prisma/client';

@Injectable()
export class AssetCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AssetCategoryCreateInput): Promise<AssetCategory> {
    return this.prisma.assetCategory.create({ data });
  }

  async findById(id: string): Promise<AssetCategory | null> {
    return this.prisma.assetCategory.findUnique({
      where: { id },
      include: { parentCategory: true },
    });
  }

  async findByCode(
    organizationId: string,
    communityId: string | null,
    code: string,
  ): Promise<AssetCategory | null> {
    return this.prisma.assetCategory.findFirst({
      where: {
        organizationId,
        OR: [{ communityId }, { communityId: null }],
        code,
      },
    });
  }

  async findMany(filters: {
    organizationId: string;
    communityId?: string | null;
    status?: 'ACTIVE' | 'ARCHIVED';
    parentId?: string | null;
    search?: string;
  }): Promise<AssetCategory[]> {
    const where: Prisma.AssetCategoryWhereInput = {
      organizationId: filters.organizationId,
    };

    if (filters.communityId !== undefined) {
      where.OR = [{ communityId: filters.communityId }, { communityId: null }];
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.assetCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { parentCategory: true },
    });
  }

  async update(id: string, data: Prisma.AssetCategoryUpdateInput): Promise<AssetCategory> {
    return this.prisma.assetCategory.update({
      where: { id },
      data,
      include: { parentCategory: true },
    });
  }
}
