import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  FacilityChecklistTemplate,
  FacilityChecklistItem,
  FacilityChecklistTemplateStatus,
} from '@community-os/types';

export type ChecklistTemplateWithRelations = FacilityChecklistTemplate & {
  category?: { name: string } | null;
};

@Injectable()
export class ChecklistTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    communityId?: string | null;
    name: string;
    code: string;
    version?: number;
    status?: FacilityChecklistTemplateStatus;
    categoryId?: string | null;
    items: FacilityChecklistItem[];
    createdById?: string | null;
  }): Promise<ChecklistTemplateWithRelations> {
    return this.prisma.facilityChecklistTemplate.create({
      data: {
        organizationId: data.organizationId,
        communityId: data.communityId ?? null,
        name: data.name,
        code: data.code,
        version: data.version ?? 1,
        status: data.status ?? 'DRAFT',
        categoryId: data.categoryId ?? null,
        items: data.items as any,
        createdById: data.createdById ?? null,
      },
      include: {
        category: { select: { name: true } },
      },
    }) as any;
  }

  async findById(id: string): Promise<ChecklistTemplateWithRelations | null> {
    return this.prisma.facilityChecklistTemplate.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
      },
    }) as any;
  }

  async findByCode(
    organizationId: string,
    communityId: string | null,
    code: string,
    version?: number,
  ): Promise<ChecklistTemplateWithRelations | null> {
    if (version) {
      return this.prisma.facilityChecklistTemplate.findFirst({
        where: {
          organizationId,
          communityId: communityId ?? null,
          code,
          version,
        },
        include: {
          category: { select: { name: true } },
        },
      }) as any;
    }

    return this.prisma.facilityChecklistTemplate.findFirst({
      where: {
        organizationId,
        communityId: communityId ?? null,
        code,
      },
      orderBy: { version: 'desc' },
      include: {
        category: { select: { name: true } },
      },
    }) as any;
  }

  async findMany(filters: {
    organizationId?: string;
    communityId?: string | null;
    status?: FacilityChecklistTemplateStatus;
    categoryId?: string;
  }): Promise<ChecklistTemplateWithRelations[]> {
    return this.prisma.facilityChecklistTemplate.findMany({
      where: {
        ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
        ...(filters.communityId !== undefined ? { communityId: filters.communityId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      status: FacilityChecklistTemplateStatus;
      categoryId: string | null;
      items: FacilityChecklistItem[];
    }>,
  ): Promise<ChecklistTemplateWithRelations> {
    return this.prisma.facilityChecklistTemplate.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.items ? { items: data.items as any } : {}),
      },
      include: {
        category: { select: { name: true } },
      },
    }) as any;
  }
}
