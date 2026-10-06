import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Unit, UnitType, UnitStatus, AreaUnit } from '@community-os/types';
import type { CreateUnitInput, UpdateUnitInput, UnitQueryParams } from '@community-os/validation';

export type UnitWithParents = Unit & {
  building?: { id: string; name: string; code: string } | null;
  floor?: { id: string; label: string } | null;
  section?: { id: string; name: string; code: string } | null;
};

@Injectable()
export class UnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UnitWithParents | null> {
    const record = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        building: { select: { id: true, name: true, code: true } },
        floor: { select: { id: true, label: true } },
        section: { select: { id: true, name: true, code: true } },
      },
    });
    return (record as unknown as UnitWithParents) || null;
  }

  async findByUnitNumber(
    communityId: string,
    unitNumber: string,
    buildingId?: string | null,
  ): Promise<Unit | null> {
    if (buildingId) {
      const record = await this.prisma.unit.findUnique({
        where: {
          communityId_buildingId_unitNumber: {
            communityId,
            buildingId,
            unitNumber: unitNumber.trim(),
          },
        },
      });
      return (record as unknown as Unit) || null;
    }

    const record = await this.prisma.unit.findFirst({
      where: {
        communityId,
        buildingId: null,
        unitNumber: unitNumber.trim(),
      },
    });
    return (record as unknown as Unit) || null;
  }

  async findMany(
    communityId: string,
    params: UnitQueryParams,
  ): Promise<{ items: UnitWithParents[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      sectionId,
      buildingId,
      floorId,
      unitType,
      status,
      search,
    } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { communityId };

    if (sectionId) where['sectionId'] = sectionId;
    if (buildingId) where['buildingId'] = buildingId;
    if (floorId) where['floorId'] = floorId;
    if (unitType) where['unitType'] = unitType;
    if (status) where['status'] = status;

    if (search && search.trim() !== '') {
      where['OR'] = [
        { unitNumber: { contains: search.trim(), mode: 'insensitive' } },
        { displayName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.unit.count({ where }),
      this.prisma.unit.findMany({
        where,
        skip,
        take: limit,
        include: {
          building: { select: { id: true, name: true, code: true } },
          floor: { select: { id: true, label: true } },
          section: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ unitNumber: 'asc' }],
      }),
    ]);

    return {
      items: records as unknown as UnitWithParents[],
      total,
    };
  }

  async create(organizationId: string, communityId: string, input: CreateUnitInput): Promise<Unit> {
    const displayName = input.displayName || input.unitNumber.trim();

    const record = await this.prisma.unit.create({
      data: {
        organizationId,
        communityId,
        sectionId: input.sectionId || null,
        buildingId: input.buildingId || null,
        floorId: input.floorId || null,
        unitNumber: input.unitNumber.trim(),
        displayName,
        unitType: input.unitType || 'APARTMENT',
        status: input.status || 'ACTIVE',
        carpetArea: input.carpetArea ?? null,
        builtUpArea: input.builtUpArea ?? null,
        superBuiltUpArea: input.superBuiltUpArea ?? null,
        areaUnit: input.areaUnit || 'SQFT',
        bedroomCount: input.bedroomCount ?? null,
        bathroomCount: input.bathroomCount ?? null,
        version: 1,
      },
    });

    return record as unknown as Unit;
  }

  async createMany(
    units: Array<{
      organizationId: string;
      communityId: string;
      sectionId?: string | null;
      buildingId?: string | null;
      floorId?: string | null;
      unitNumber: string;
      displayName: string;
      unitType: UnitType;
      status: UnitStatus;
      carpetArea?: number | null;
      builtUpArea?: number | null;
      superBuiltUpArea?: number | null;
      areaUnit: AreaUnit;
      bedroomCount?: number | null;
      bathroomCount?: number | null;
      version: number;
    }>,
  ): Promise<number> {
    const res = await this.prisma.unit.createMany({
      data: units,
      skipDuplicates: true,
    });
    return res.count;
  }

  async update(id: string, input: UpdateUnitInput): Promise<Unit> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.sectionId !== undefined) data['sectionId'] = input.sectionId;
    if (input.buildingId !== undefined) data['buildingId'] = input.buildingId;
    if (input.floorId !== undefined) data['floorId'] = input.floorId;
    if (input.displayName !== undefined) data['displayName'] = input.displayName.trim();
    if (input.unitType !== undefined) data['unitType'] = input.unitType;
    if (input.status !== undefined) data['status'] = input.status;
    if (input.carpetArea !== undefined) data['carpetArea'] = input.carpetArea;
    if (input.builtUpArea !== undefined) data['builtUpArea'] = input.builtUpArea;
    if (input.superBuiltUpArea !== undefined) data['superBuiltUpArea'] = input.superBuiltUpArea;
    if (input.areaUnit !== undefined) data['areaUnit'] = input.areaUnit;
    if (input.bedroomCount !== undefined) data['bedroomCount'] = input.bedroomCount;
    if (input.bathroomCount !== undefined) data['bathroomCount'] = input.bathroomCount;

    const record = await this.prisma.unit.update({
      where: { id, version: input.version },
      data,
    });

    return record as unknown as Unit;
  }
}
