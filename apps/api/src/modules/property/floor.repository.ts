import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Floor } from '@community-os/types';
import type {
  CreateFloorInput,
  UpdateFloorInput,
  FloorQueryParams,
} from '@community-os/validation';

@Injectable()
export class FloorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Floor | null> {
    const record = await this.prisma.floor.findUnique({
      where: { id },
      include: {
        building: true,
        units: true,
        _count: { select: { units: true } },
      },
    });
    return (record as unknown as Floor) || null;
  }

  async findByLabel(buildingId: string, label: string): Promise<Floor | null> {
    const record = await this.prisma.floor.findUnique({
      where: {
        buildingId_label: {
          buildingId,
          label: label.trim(),
        },
      },
    });
    return (record as unknown as Floor) || null;
  }

  async findMany(
    buildingId: string,
    params: FloorQueryParams,
  ): Promise<{ items: Floor[]; total: number }> {
    const { page = 1, limit = 50, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { buildingId };

    if (status) where['status'] = status;
    if (search && search.trim() !== '') {
      where['label'] = { contains: search.trim(), mode: 'insensitive' };
    }

    const [total, records] = await Promise.all([
      this.prisma.floor.count({ where }),
      this.prisma.floor.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { units: true } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return {
      items: records as unknown as Floor[],
      total,
    };
  }

  async create(
    organizationId: string,
    communityId: string,
    buildingId: string,
    input: CreateFloorInput,
  ): Promise<Floor> {
    const record = await this.prisma.floor.create({
      data: {
        organizationId,
        communityId,
        buildingId,
        label: input.label.trim(),
        levelNumber: input.levelNumber ?? null,
        sortOrder: input.sortOrder || 0,
        status: 'ACTIVE',
        version: 1,
      },
    });

    return record as unknown as Floor;
  }

  async update(id: string, input: UpdateFloorInput): Promise<Floor> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.label !== undefined) data['label'] = input.label.trim();
    if (input.levelNumber !== undefined) data['levelNumber'] = input.levelNumber;
    if (input.status !== undefined) data['status'] = input.status;
    if (input.sortOrder !== undefined) data['sortOrder'] = input.sortOrder;

    const record = await this.prisma.floor.update({
      where: { id, version: input.version },
      data,
    });

    return record as unknown as Floor;
  }
}
