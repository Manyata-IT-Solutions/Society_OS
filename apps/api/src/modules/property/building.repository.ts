import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Building } from '@community-os/types';
import type {
  CreateBuildingInput,
  UpdateBuildingInput,
  BuildingQueryParams,
} from '@community-os/validation';

@Injectable()
export class BuildingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Building | null> {
    const record = await this.prisma.building.findUnique({
      where: { id },
      include: {
        section: true,
        floors: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { floors: true, units: true } },
      },
    });
    return (record as unknown as Building) || null;
  }

  async findByCode(communityId: string, code: string): Promise<Building | null> {
    const record = await this.prisma.building.findUnique({
      where: {
        communityId_code: {
          communityId,
          code: code.toUpperCase().trim(),
        },
      },
    });
    return (record as unknown as Building) || null;
  }

  async findMany(
    communityId: string,
    params: BuildingQueryParams,
  ): Promise<{ items: Building[]; total: number }> {
    const { page = 1, limit = 20, sectionId, buildingType, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { communityId };

    if (sectionId) where['sectionId'] = sectionId;
    if (buildingType) where['buildingType'] = buildingType;
    if (status) where['status'] = status;
    if (search && search.trim() !== '') {
      where['OR'] = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { code: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.building.count({ where }),
      this.prisma.building.findMany({
        where,
        skip,
        take: limit,
        include: {
          section: true,
          _count: { select: { floors: true, units: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      items: records as unknown as Building[],
      total,
    };
  }

  async create(
    organizationId: string,
    communityId: string,
    input: CreateBuildingInput,
  ): Promise<Building> {
    const record = await this.prisma.building.create({
      data: {
        organizationId,
        communityId,
        sectionId: input.sectionId || null,
        name: input.name.trim(),
        code: input.code.toUpperCase().trim(),
        buildingType: input.buildingType || 'TOWER',
        status: 'ACTIVE',
        numberOfFloors: input.numberOfFloors ?? null,
        sortOrder: input.sortOrder || 0,
        version: 1,
      },
    });

    return record as unknown as Building;
  }

  async update(id: string, input: UpdateBuildingInput): Promise<Building> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.name !== undefined) data['name'] = input.name.trim();
    if (input.sectionId !== undefined) data['sectionId'] = input.sectionId;
    if (input.buildingType !== undefined) data['buildingType'] = input.buildingType;
    if (input.status !== undefined) data['status'] = input.status;
    if (input.numberOfFloors !== undefined) data['numberOfFloors'] = input.numberOfFloors;
    if (input.sortOrder !== undefined) data['sortOrder'] = input.sortOrder;

    const record = await this.prisma.building.update({
      where: { id, version: input.version },
      data,
    });

    return record as unknown as Building;
  }
}
