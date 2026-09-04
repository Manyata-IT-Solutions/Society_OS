import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, TicketPriority, TicketCategoryStatus } from '@prisma/client';
import type { TicketCategory } from '@community-os/types';

@Injectable()
export class TicketCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TicketCategoryUncheckedCreateInput): Promise<TicketCategory> {
    const record = await this.prisma.ticketCategory.create({
      data,
    });
    return this.mapToDomain(record);
  }

  async findById(
    id: string,
  ): Promise<(TicketCategory & { subcategories?: TicketCategory[] }) | null> {
    const record = await this.prisma.ticketCategory.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    if (!record) return null;
    return {
      ...this.mapToDomain(record),
      subcategories: record.subcategories?.map((sc) => this.mapToDomain(sc)),
    };
  }

  async findByKey(
    organizationId: string,
    communityId: string | null,
    key: string,
  ): Promise<TicketCategory | null> {
    const record = await this.prisma.ticketCategory.findFirst({
      where: {
        organizationId,
        communityId: communityId ?? null,
        key,
      },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async findMany(filters: {
    organizationId?: string;
    communityId?: string | null;
    residentVisible?: boolean;
    status?: TicketCategoryStatus;
    parentId?: string | null;
  }): Promise<TicketCategory[]> {
    const where: Prisma.TicketCategoryWhereInput = {};
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.communityId !== undefined) {
      where.OR = [{ communityId: filters.communityId }, { communityId: null }];
    }
    if (filters.residentVisible !== undefined) where.residentVisible = filters.residentVisible;
    if (filters.status) where.status = filters.status;
    if (filters.parentId !== undefined) where.parentId = filters.parentId;

    const records = await this.prisma.ticketCategory.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findTree(
    organizationId: string,
    communityId?: string | null,
    residentVisible?: boolean,
  ): Promise<Array<TicketCategory & { subcategories: TicketCategory[] }>> {
    const where: Prisma.TicketCategoryWhereInput = {
      organizationId,
      parentId: null,
      status: 'ACTIVE',
    };

    if (communityId) {
      where.OR = [{ communityId }, { communityId: null }];
    }
    if (residentVisible !== undefined) {
      where.residentVisible = residentVisible;
    }

    const records = await this.prisma.ticketCategory.findMany({
      where,
      include: {
        subcategories: {
          where: {
            status: 'ACTIVE',
            ...(residentVisible !== undefined ? { residentVisible } : {}),
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return records.map((r) => ({
      ...this.mapToDomain(r),
      subcategories: r.subcategories.map((sc) => this.mapToDomain(sc)),
    }));
  }

  async update(
    id: string,
    data: Prisma.TicketCategoryUncheckedUpdateInput,
  ): Promise<TicketCategory> {
    const record = await this.prisma.ticketCategory.update({
      where: { id },
      data,
    });
    return this.mapToDomain(record);
  }

  async archive(id: string): Promise<TicketCategory> {
    const record = await this.prisma.ticketCategory.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return this.mapToDomain(record);
  }

  private mapToDomain(record: {
    id: string;
    organizationId: string;
    communityId: string | null;
    parentId: string | null;
    key: string;
    name: string;
    description: string | null;
    status: TicketCategoryStatus;
    defaultPriority: TicketPriority;
    defaultSlaPolicyId: string | null;
    defaultTeamId: string | null;
    workflowDefinitionId: string | null;
    residentVisible: boolean;
    isSensitive: boolean;
    allowAttachments: boolean;
    displayOrder: number;
    createdById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TicketCategory {
    return {
      id: record.id,
      organizationId: record.organizationId,
      communityId: record.communityId,
      parentId: record.parentId,
      key: record.key,
      name: record.name,
      description: record.description,
      status: record.status as TicketCategory['status'],
      defaultPriority: record.defaultPriority as TicketCategory['defaultPriority'],
      defaultSlaPolicyId: record.defaultSlaPolicyId,
      defaultTeamId: record.defaultTeamId,
      workflowDefinitionId: record.workflowDefinitionId,
      residentVisible: record.residentVisible,
      isSensitive: record.isSensitive,
      allowAttachments: record.allowAttachments,
      displayOrder: record.displayOrder,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
