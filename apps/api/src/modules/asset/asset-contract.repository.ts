import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, AssetServiceContract, AssetServiceContractLink } from '@prisma/client';

@Injectable()
export class AssetContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.AssetServiceContractCreateInput,
    coveredAssetIds?: string[],
  ): Promise<AssetServiceContract> {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.assetServiceContract.create({ data });

      if (coveredAssetIds && coveredAssetIds.length > 0) {
        await tx.assetServiceContractLink.createMany({
          data: coveredAssetIds.map((assetId) => ({
            contractId: contract.id,
            assetId,
          })),
        });
      }

      return tx.assetServiceContract.findUniqueOrThrow({
        where: { id: contract.id },
        include: {
          coveredAssets: {
            include: { asset: true },
          },
        },
      });
    });
  }

  async findById(id: string): Promise<AssetServiceContract | null> {
    return this.prisma.assetServiceContract.findUnique({
      where: { id },
      include: {
        coveredAssets: {
          include: { asset: true },
        },
      },
    });
  }

  async findMany(filters: {
    organizationId?: string;
    communityId?: string;
    status?: Prisma.AssetServiceContractWhereInput['status'];
    contractType?: Prisma.AssetServiceContractWhereInput['contractType'];
    search?: string;
  }): Promise<AssetServiceContract[]> {
    const where: Prisma.AssetServiceContractWhereInput = {};
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.communityId) where.communityId = filters.communityId;
    if (filters.status) where.status = filters.status;
    if (filters.contractType) where.contractType = filters.contractType;
    if (filters.search) {
      where.OR = [
        { contractNumber: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { serviceProviderName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.assetServiceContract.findMany({
      where,
      orderBy: { endDate: 'desc' },
      include: {
        coveredAssets: {
          include: { asset: true },
        },
      },
    });
  }

  async linkAssets(
    contractId: string,
    assetIds: string[],
    notes?: string | null,
  ): Promise<AssetServiceContractLink[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: AssetServiceContractLink[] = [];
      for (const assetId of assetIds) {
        const link = await tx.assetServiceContractLink.upsert({
          where: {
            contractId_assetId: { contractId, assetId },
          },
          create: {
            contractId,
            assetId,
            notes: notes ?? null,
          },
          update: {
            notes: notes !== undefined ? notes : undefined,
          },
        });
        results.push(link);
      }
      return results;
    });
  }

  async unlinkAsset(contractId: string, assetId: string): Promise<void> {
    await this.prisma.assetServiceContractLink.delete({
      where: {
        contractId_assetId: { contractId, assetId },
      },
    });
  }
}
