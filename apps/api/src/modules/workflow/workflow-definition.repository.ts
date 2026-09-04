import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, WorkflowDefinition } from '@prisma/client';

@Injectable()
export class WorkflowDefinitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<WorkflowDefinition | null> {
    return this.prisma.workflowDefinition.findUnique({
      where: { id },
    });
  }

  async findByKeyAndVersion(
    organizationId: string | null | undefined,
    communityId: string | null | undefined,
    key: string,
    version: number,
  ): Promise<WorkflowDefinition | null> {
    return this.prisma.workflowDefinition.findFirst({
      where: {
        key,
        version,
        OR: [
          { organizationId: organizationId ?? null, communityId: communityId ?? null },
          { organizationId: organizationId ?? null, communityId: null },
          { organizationId: null, communityId: null },
        ],
      },
      orderBy: [{ communityId: 'desc' }, { organizationId: 'desc' }],
    });
  }

  async findLatestPublished(
    organizationId: string | null | undefined,
    communityId: string | null | undefined,
    key: string,
  ): Promise<WorkflowDefinition | null> {
    return this.prisma.workflowDefinition.findFirst({
      where: {
        key,
        status: 'PUBLISHED',
        OR: [
          { organizationId: organizationId ?? null, communityId: communityId ?? null },
          { organizationId: organizationId ?? null, communityId: null },
          { organizationId: null, communityId: null },
        ],
      },
      orderBy: { version: 'desc' },
    });
  }

  async list(params: {
    organizationId?: string | null;
    communityId?: string | null;
    entityType?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
    skip?: number;
    take?: number;
  }): Promise<{ items: WorkflowDefinition[]; total: number }> {
    const where: Prisma.WorkflowDefinitionWhereInput = {};
    if (params.organizationId !== undefined) {
      where.organizationId = params.organizationId;
    }
    if (params.communityId !== undefined) {
      where.communityId = params.communityId;
    }
    if (params.entityType) {
      where.entityType = params.entityType;
    }
    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.workflowDefinition.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: [{ key: 'asc' }, { version: 'desc' }],
      }),
      this.prisma.workflowDefinition.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: Prisma.WorkflowDefinitionCreateInput): Promise<WorkflowDefinition> {
    return this.prisma.workflowDefinition.create({ data });
  }

  async update(
    id: string,
    data: Prisma.WorkflowDefinitionUpdateInput,
  ): Promise<WorkflowDefinition> {
    return this.prisma.workflowDefinition.update({
      where: { id },
      data,
    });
  }

  async getLatestVersionNumber(
    organizationId: string | null | undefined,
    communityId: string | null | undefined,
    key: string,
  ): Promise<number> {
    const latest = await this.prisma.workflowDefinition.findFirst({
      where: {
        organizationId: organizationId ?? null,
        communityId: communityId ?? null,
        key,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return latest?.version ?? 0;
  }
}
