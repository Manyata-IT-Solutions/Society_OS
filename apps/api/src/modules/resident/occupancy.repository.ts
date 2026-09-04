import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { UnitOccupancy, OccupancyType, OccupancyStatus } from '@community-os/types';
import type { CreateOccupancyInput, OccupancyQueryParams } from '@community-os/validation';

export type OccupancyWithRelations = UnitOccupancy & {
  household?: {
    id: string;
    name: string | null;
    status: string;
    startDate: Date;
    endDate: Date | null;
    primaryContact?: {
      id: string;
      firstName: string;
      lastName: string;
      displayName: string | null;
    } | null;
    members?: Array<{
      id: string;
      relationshipType: string;
      resident: { id: string; firstName: string; lastName: string };
    }>;
  };
};

@Injectable()
export class OccupancyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OccupancyWithRelations | null> {
    const record = await this.prisma.unitOccupancy.findUnique({
      where: { id },
      include: {
        household: {
          include: {
            primaryContact: true,
            members: { include: { resident: true } },
          },
        },
      },
    });
    return (record as unknown as OccupancyWithRelations) || null;
  }

  async findActiveByUnitId(unitId: string): Promise<OccupancyWithRelations | null> {
    const now = new Date();
    const record = await this.prisma.unitOccupancy.findFirst({
      where: {
        unitId,
        status: 'ACTIVE',
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        household: {
          include: {
            primaryContact: true,
            members: { include: { resident: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
    return (record as unknown as OccupancyWithRelations) || null;
  }

  async findByUnitId(
    unitId: string,
    params: OccupancyQueryParams,
  ): Promise<{ items: OccupancyWithRelations[]; total: number }> {
    const { page = 1, limit = 50, status, occupancyType, householdId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { unitId };
    if (status) where['status'] = status;
    if (occupancyType) where['occupancyType'] = occupancyType;
    if (householdId) where['householdId'] = householdId;

    const [total, records] = await Promise.all([
      this.prisma.unitOccupancy.count({ where }),
      this.prisma.unitOccupancy.findMany({
        where,
        skip,
        take: limit,
        include: {
          household: {
            include: {
              primaryContact: true,
              members: { include: { resident: true } },
            },
          },
        },
        orderBy: [{ startDate: 'desc' }],
      }),
    ]);

    return {
      items: records as unknown as OccupancyWithRelations[],
      total,
    };
  }

  async findConflictingOccupancies(
    unitId: string,
    startDate: Date,
    endDate?: Date | null,
    excludeId?: string,
  ): Promise<UnitOccupancy[]> {
    // Condition for overlap:
    // Existing occupancy is ACTIVE or SCHEDULED
    // (existing.startDate <= new.endDate OR new.endDate is null)
    // AND (existing.endDate >= new.startDate OR existing.endDate is null)

    const conditions: Record<string, unknown>[] = [
      { unitId },
      { status: { in: ['ACTIVE', 'SCHEDULED'] } },
    ];

    if (excludeId) {
      conditions.push({ id: { not: excludeId } });
    }

    if (endDate) {
      conditions.push({ startDate: { lte: endDate } });
    }

    conditions.push({
      OR: [{ endDate: null }, { endDate: { gte: startDate } }],
    });

    const records = await this.prisma.unitOccupancy.findMany({
      where: { AND: conditions },
    });

    return records as unknown as UnitOccupancy[];
  }

  async create(
    organizationId: string,
    communityId: string,
    input: CreateOccupancyInput,
  ): Promise<UnitOccupancy> {
    const record = await this.prisma.unitOccupancy.create({
      data: {
        organizationId,
        communityId,
        unitId: input.unitId,
        householdId: input.householdId,
        occupancyType: (input.occupancyType || 'OWNER_OCCUPIED') as OccupancyType,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: (input.status || 'ACTIVE') as OccupancyStatus,
        version: 1,
      },
    });
    return record as unknown as UnitOccupancy;
  }

  async endOccupancy(id: string, endDate: Date): Promise<void> {
    await this.prisma.unitOccupancy.update({
      where: { id },
      data: {
        status: 'ENDED',
        endDate,
        version: { increment: 1 },
      },
    });
  }
}
