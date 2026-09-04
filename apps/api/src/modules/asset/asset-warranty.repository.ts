import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, AssetWarranty } from '@prisma/client';

@Injectable()
export class AssetWarrantyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AssetWarrantyCreateInput): Promise<AssetWarranty> {
    return this.prisma.assetWarranty.create({ data });
  }

  async findById(id: string): Promise<AssetWarranty | null> {
    return this.prisma.assetWarranty.findUnique({
      where: { id },
      include: { asset: true },
    });
  }

  async findByAssetId(assetId: string): Promise<AssetWarranty[]> {
    return this.prisma.assetWarranty.findMany({
      where: { assetId },
      orderBy: { endDate: 'desc' },
    });
  }

  async update(id: string, data: Prisma.AssetWarrantyUpdateInput): Promise<AssetWarranty> {
    return this.prisma.assetWarranty.update({
      where: { id },
      data,
    });
  }
}
