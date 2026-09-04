import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, RuleDefinition } from '@prisma/client';

@Injectable()
export class RuleDefinitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RuleDefinition | null> {
    return this.prisma.ruleDefinition.findUnique({
      where: { id },
    });
  }

  async findByKeyAndVersion(
    organizationId: string | null | undefined,
    communityId: string | null | undefined,
    key: string,
    version: number,
  ): Promise<RuleDefinition | null> {
    return this.prisma.ruleDefinition.findFirst({
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
  ): Promise<RuleDefinition | null> {
    return this.prisma.ruleDefinition.findFirst({
      where: {
        key,
        status: 'PUBLISHED',
        OR: [
          { organizationId: organizationId ?? null, communityId: communityId ?? null },
          { organizationId: organizationId ?? null, communityId: null },
          { organizationId: null, communityId: null },
        ],
      },
      orderBy: [{ version: 'desc' }],
    });
  }

  async list(params: {
    organizationId?: string | null;
    communityId?: string | null;
    resourceType?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
    skip?: number;
    take?: number;
  }): Promise<{ items: RuleDefinition[]; total: number }> {
    const where: Prisma.RuleDefinitionWhereInput = {};

    if (params.organizationId !== undefined) {
      where.organizationId = params.organizationId;
    }
    if (params.communityId !== undefined) {
      where.communityId = params.communityId;
    }
    if (params.resourceType) {
      where.resourceType = params.resourceType;
    }
    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.ruleDefinition.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: [{ key: 'asc' }, { version: 'desc' }],
      }),
      this.prisma.ruleDefinition.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: Prisma.RuleDefinitionCreateInput): Promise<RuleDefinition> {
    return this.prisma.ruleDefinition.create({ data });
  }

  async update(id: string, data: Prisma.RuleDefinitionUpdateInput): Promise<RuleDefinition> {
    return this.prisma.ruleDefinition.update({
      where: { id },
      data,
    });
  }

  async getLatestVersionNumber(
    organizationId: string | null | undefined,
    communityId: string | null | undefined,
    key: string,
  ): Promise<number> {
    const latest = await this.prisma.ruleDefinition.findFirst({
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
