import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  Prisma,
  Asset,
  AssetLocationHistory,
  AssetDowntime,
  AssetServiceRecord,
  WorkOrderAssetLink,
} from '@prisma/client';
import type { AssetKpiMetrics } from '@community-os/types';

@Injectable()
export class AssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AssetCreateInput): Promise<Asset> {
    return this.prisma.asset.create({
      data,
      include: {
        category: true,
        model: true,
        building: true,
        unit: true,
        parentAsset: true,
      },
    });
  }

  async findById(id: string): Promise<Asset | null> {
    return this.prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        model: true,
        building: true,
        unit: true,
        parentAsset: true,
        warranties: { orderBy: { endDate: 'desc' } },
        serviceContractLinks: {
          include: { contract: true },
        },
        meters: { where: { status: 'ACTIVE' } },
        childAssets: {
          include: { category: true, model: true },
        },
      },
    });
  }

  async findByCode(
    organizationId: string,
    communityId: string,
    assetCode: string,
  ): Promise<Asset | null> {
    return this.prisma.asset.findUnique({
      where: {
        organizationId_communityId_assetCode: {
          organizationId,
          communityId,
          assetCode,
        },
      },
      include: {
        category: true,
        model: true,
        building: true,
        unit: true,
      },
    });
  }

  async findByIdentifier(identifier: string): Promise<Asset | null> {
    return this.prisma.asset.findFirst({
      where: {
        OR: [
          { qrIdentifier: identifier },
          { barcodeIdentifier: identifier },
          { assetCode: identifier },
        ],
      },
      include: {
        category: true,
        model: true,
        building: true,
        unit: true,
        warranties: { orderBy: { endDate: 'desc' } },
        serviceContractLinks: { include: { contract: true } },
        meters: { where: { status: 'ACTIVE' } },
      },
    });
  }

  async findMany(filters: {
    organizationId?: string;
    communityId?: string;
    categoryId?: string;
    modelId?: string;
    lifecycleState?: Prisma.AssetWhereInput['lifecycleState'];
    operationalStatus?: Prisma.AssetWhereInput['operationalStatus'];
    condition?: Prisma.AssetWhereInput['condition'];
    criticality?: Prisma.AssetWhereInput['criticality'];
    buildingId?: string;
    floorId?: string;
    unitId?: string;
    parentAssetId?: string;
    isMovable?: boolean;
    manufacturer?: string;
    search?: string;
    warrantyExpiringDays?: number;
    contractExpiringDays?: number;
    maintenanceDueBefore?: Date;
    page?: number;
    limit?: number;
    sortBy?:
      | 'assetCode'
      | 'name'
      | 'createdAt'
      | 'installationDate'
      | 'criticality'
      | 'warrantyEndDate'
      | 'nextMaintenanceDueAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: Asset[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {};
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.communityId) where.communityId = filters.communityId;
    if (filters.categoryId) where.assetCategoryId = filters.categoryId;
    if (filters.modelId) where.assetModelId = filters.modelId;
    if (filters.lifecycleState) where.lifecycleState = filters.lifecycleState;
    if (filters.operationalStatus) where.operationalStatus = filters.operationalStatus;
    if (filters.condition) where.condition = filters.condition;
    if (filters.criticality) where.criticality = filters.criticality;
    if (filters.buildingId) where.buildingId = filters.buildingId;
    if (filters.floorId) where.floorId = filters.floorId;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.parentAssetId) where.parentAssetId = filters.parentAssetId;
    if (filters.isMovable !== undefined) where.isMovable = filters.isMovable;
    if (filters.manufacturer)
      where.manufacturer = { contains: filters.manufacturer, mode: 'insensitive' };
    if (filters.maintenanceDueBefore)
      where.nextMaintenanceDueAt = { lte: filters.maintenanceDueBefore };

    if (filters.warrantyExpiringDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.warrantyExpiringDays);
      where.warrantyEndDate = {
        gte: new Date(),
        lte: futureDate,
      };
    }

    if (filters.search) {
      where.OR = [
        { assetCode: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { manufacturer: { contains: filters.search, mode: 'insensitive' } },
        { modelNumber: { contains: filters.search, mode: 'insensitive' } },
        { qrIdentifier: { contains: filters.search, mode: 'insensitive' } },
        { barcodeIdentifier: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
          model: true,
          building: true,
          unit: true,
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset> {
    return this.prisma.asset.update({
      where: { id },
      data,
      include: {
        category: true,
        model: true,
        building: true,
        unit: true,
        parentAsset: true,
      },
    });
  }

  async recordLocationMove(
    assetId: string,
    historyData: Prisma.AssetLocationHistoryCreateWithoutAssetInput,
    updateData: Prisma.AssetUpdateInput,
  ): Promise<Asset> {
    return this.prisma.$transaction(async (tx) => {
      await tx.assetLocationHistory.create({
        data: {
          ...historyData,
          asset: { connect: { id: assetId } },
        },
      });

      return tx.asset.update({
        where: { id: assetId },
        data: updateData,
        include: {
          category: true,
          model: true,
          building: true,
          unit: true,
        },
      });
    });
  }

  async recordDowntime(data: Prisma.AssetDowntimeCreateInput): Promise<AssetDowntime> {
    return this.prisma.assetDowntime.create({ data });
  }

  async findOpenDowntime(assetId: string): Promise<AssetDowntime | null> {
    return this.prisma.assetDowntime.findFirst({
      where: {
        assetId,
        endedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async closeDowntime(
    downtimeId: string,
    endedAt: Date,
    durationMinutes: number,
    closedById: string | null,
    notes?: string | null,
  ): Promise<AssetDowntime> {
    return this.prisma.assetDowntime.update({
      where: { id: downtimeId },
      data: {
        endedAt,
        durationMinutes,
        closedByUser: closedById ? { connect: { id: closedById } } : undefined,
        notes: notes ?? undefined,
      },
    });
  }

  async recordServiceRecord(
    data: Prisma.AssetServiceRecordCreateInput,
  ): Promise<AssetServiceRecord> {
    return this.prisma.assetServiceRecord.create({ data });
  }

  async linkWorkOrder(data: Prisma.WorkOrderAssetLinkCreateInput): Promise<WorkOrderAssetLink> {
    return this.prisma.workOrderAssetLink.create({
      data,
      include: { asset: true, workOrder: true },
    });
  }

  async getServiceHistory(assetId: string): Promise<{
    workOrders: unknown[];
    serviceRecords: AssetServiceRecord[];
    downtimes: AssetDowntime[];
    locationHistories: AssetLocationHistory[];
  }> {
    const [workOrders, serviceRecords, downtimes, locationHistories] = await Promise.all([
      this.prisma.workOrderAssetLink.findMany({
        where: { assetId },
        include: {
          workOrder: {
            include: {
              category: true,
              primaryAssignee: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assetServiceRecord.findMany({
        where: { assetId },
        orderBy: { serviceDate: 'desc' },
      }),
      this.prisma.assetDowntime.findMany({
        where: { assetId },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.assetLocationHistory.findMany({
        where: { assetId },
        orderBy: { movedAt: 'desc' },
      }),
    ]);

    return {
      workOrders,
      serviceRecords,
      downtimes,
      locationHistories,
    };
  }

  async getLocationHistory(assetId: string): Promise<AssetLocationHistory[]> {
    return this.prisma.assetLocationHistory.findMany({
      where: { assetId },
      orderBy: { movedAt: 'desc' },
      include: { movedByUser: true },
    });
  }

  async countActiveWorkOrders(assetId: string): Promise<number> {
    return this.prisma.workOrderAssetLink.count({
      where: {
        assetId,
        workOrder: {
          currentState: {
            notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'],
          },
        },
      },
    });
  }

  async getKpiMetrics(
    organizationId: string,
    communityId?: string | null,
  ): Promise<AssetKpiMetrics> {
    const where: Prisma.AssetWhereInput = { organizationId };
    if (communityId) where.communityId = communityId;

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const [
      totalAssets,
      activeAssets,
      criticalAssets,
      outOfServiceAssets,
      underMaintenanceAssets,
      warrantyExpiringSoonCount,
      contractExpiringSoonCount,
      maintenanceDueCount,
      overdueMaintenanceCount,
      openBreakdownsCount,
      totalDowntimeAgg,
      byCategory,
      byCondition,
      byCriticality,
    ] = await Promise.all([
      this.prisma.asset.count({ where }),
      this.prisma.asset.count({ where: { ...where, lifecycleState: 'ACTIVE', status: 'ACTIVE' } }),
      this.prisma.asset.count({ where: { ...where, criticality: 'CRITICAL', status: 'ACTIVE' } }),
      this.prisma.asset.count({
        where: { ...where, operationalStatus: 'OUT_OF_SERVICE', status: 'ACTIVE' },
      }),
      this.prisma.asset.count({
        where: { ...where, operationalStatus: 'UNDER_MAINTENANCE', status: 'ACTIVE' },
      }),
      this.prisma.assetWarranty.count({
        where: {
          asset: where,
          status: 'ACTIVE',
          endDate: { gte: now, lte: in30Days },
        },
      }),
      this.prisma.assetServiceContract.count({
        where: {
          ...(communityId ? { communityId } : { organizationId }),
          status: 'ACTIVE',
          endDate: { gte: now, lte: in30Days },
        },
      }),
      this.prisma.asset.count({
        where: {
          ...where,
          status: 'ACTIVE',
          nextMaintenanceDueAt: { gte: now, lte: in30Days },
        },
      }),
      this.prisma.asset.count({
        where: {
          ...where,
          status: 'ACTIVE',
          nextMaintenanceDueAt: { lt: now },
        },
      }),
      this.prisma.assetDowntime.count({
        where: {
          asset: where,
          endedAt: null,
          reason: 'BREAKDOWN',
        },
      }),
      this.prisma.assetDowntime.aggregate({
        where: { asset: where },
        _sum: { durationMinutes: true },
      }),
      this.prisma.asset.groupBy({
        by: ['assetCategoryId'],
        where,
        _count: { id: true },
      }),
      this.prisma.asset.groupBy({
        by: ['condition'],
        where,
        _count: { id: true },
      }),
      this.prisma.asset.groupBy({
        by: ['criticality'],
        where,
        _count: { id: true },
      }),
    ]);

    // Categories name lookup
    const categoryIds = byCategory.map((c) => c.assetCategoryId);
    const categories = await this.prisma.assetCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const totalDowntime = totalDowntimeAgg._sum.durationMinutes || 0;
    // 30-day availability base = 30 days * 24h * 60m * totalAssets
    const totalPotentialMinutes = Math.max(1, (totalAssets || 1) * 30 * 24 * 60);
    const availabilityPercentage = Math.max(
      0,
      Math.min(100, Number(((1 - totalDowntime / totalPotentialMinutes) * 100).toFixed(2))),
    );

    return {
      totalAssets,
      activeAssets,
      criticalAssets,
      outOfServiceAssets,
      underMaintenanceAssets,
      warrantyExpiringSoonCount,
      contractExpiringSoonCount,
      maintenanceDueCount,
      overdueMaintenanceCount,
      openBreakdownsCount,
      availabilityPercentage,
      assetsByCategory: byCategory.map((c) => ({
        categoryId: c.assetCategoryId,
        categoryName: categoryMap.get(c.assetCategoryId) || 'Unknown',
        count: c._count.id,
      })),
      assetsByCondition: byCondition.map((c) => ({
        condition: c.condition,
        count: c._count.id,
      })),
      assetsByCriticality: byCriticality.map((c) => ({
        criticality: c.criticality,
        count: c._count.id,
      })),
    };
  }
}
