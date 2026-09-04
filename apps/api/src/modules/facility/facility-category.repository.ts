import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { FacilityWorkCategory, WorkOrderPriority, EntityStatus } from '@community-os/types';

export type CategoryWithTeam = FacilityWorkCategory & {
  defaultTeam?: { name: string } | null;
};

@Injectable()
export class FacilityCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    communityId?: string | null;
    key: string;
    name: string;
    description?: string | null;
    status?: EntityStatus;
    defaultTeamId?: string | null;
    defaultPriority?: WorkOrderPriority;
    defaultSlaPolicyId?: string | null;
    createdById?: string | null;
  }): Promise<CategoryWithTeam> {
    return this.prisma.facilityWorkCategory.create({
      data: {
        organizationId: data.organizationId,
        communityId: data.communityId ?? null,
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        status: data.status ?? 'ACTIVE',
        defaultTeamId: data.defaultTeamId ?? null,
        defaultPriority: data.defaultPriority ?? 'NORMAL',
        defaultSlaPolicyId: data.defaultSlaPolicyId ?? null,
        createdById: data.createdById ?? null,
      },
      include: {
        defaultTeam: { select: { name: true } },
      },
    }) as any;
  }

  async findById(id: string): Promise<CategoryWithTeam | null> {
    return this.prisma.facilityWorkCategory.findUnique({
      where: { id },
      include: {
        defaultTeam: { select: { name: true } },
      },
    }) as any;
  }

  async findByKey(
    organizationId: string,
    communityId: string | null,
    key: string,
  ): Promise<CategoryWithTeam | null> {
    return this.prisma.facilityWorkCategory.findFirst({
      where: {
        organizationId,
        communityId: communityId ?? null,
        key,
      },
      include: {
        defaultTeam: { select: { name: true } },
      },
    }) as any;
  }

  async findMany(filters: {
    organizationId?: string;
    communityId?: string | null;
    status?: EntityStatus;
  }): Promise<CategoryWithTeam[]> {
    return this.prisma.facilityWorkCategory.findMany({
      where: {
        ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
        ...(filters.communityId !== undefined ? { communityId: filters.communityId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: {
        defaultTeam: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    }) as any;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      status: EntityStatus;
      defaultTeamId: string | null;
      defaultPriority: WorkOrderPriority;
      defaultSlaPolicyId: string | null;
    }>,
  ): Promise<CategoryWithTeam> {
    return this.prisma.facilityWorkCategory.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.defaultTeamId !== undefined ? { defaultTeamId: data.defaultTeamId } : {}),
        ...(data.defaultPriority ? { defaultPriority: data.defaultPriority } : {}),
        ...(data.defaultSlaPolicyId !== undefined
          ? { defaultSlaPolicyId: data.defaultSlaPolicyId }
          : {}),
      },
      include: {
        defaultTeam: { select: { name: true } },
      },
    }) as any;
  }
}
