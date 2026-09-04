import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, SlaInstance } from '@prisma/client';

@Injectable()
export class SlaInstanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SlaInstance | null> {
    return this.prisma.slaInstance.findUnique({
      where: { id },
      include: {
        policyDefinition: true,
        calendar: true,
      },
    });
  }

  async findActiveByResource(
    resourceType: string,
    resourceId: string,
    policyKey?: string,
  ): Promise<SlaInstance | null> {
    const where: Prisma.SlaInstanceWhereInput = {
      resourceType,
      resourceId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    };
    if (policyKey) {
      where.policyKey = policyKey;
    }
    return this.prisma.slaInstance.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        policyDefinition: true,
        calendar: true,
      },
    });
  }

  async findActiveByWorkflow(
    workflowInstanceId: string,
    policyKey?: string,
  ): Promise<SlaInstance | null> {
    const where: Prisma.SlaInstanceWhereInput = {
      workflowInstanceId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    };
    if (policyKey) {
      where.policyKey = policyKey;
    }
    return this.prisma.slaInstance.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        policyDefinition: true,
        calendar: true,
      },
    });
  }

  async list(params: {
    organizationId?: string | null;
    communityId?: string | null;
    resourceType?: string;
    resourceId?: string;
    workflowInstanceId?: string;
    status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'BREACHED' | 'CANCELLED';
    skip?: number;
    take?: number;
  }): Promise<{ items: SlaInstance[]; total: number }> {
    const where: Prisma.SlaInstanceWhereInput = {};
    if (params.organizationId !== undefined) {
      where.organizationId = params.organizationId;
    }
    if (params.communityId !== undefined) {
      where.communityId = params.communityId;
    }
    if (params.resourceType) {
      where.resourceType = params.resourceType;
    }
    if (params.resourceId) {
      where.resourceId = params.resourceId;
    }
    if (params.workflowInstanceId) {
      where.workflowInstanceId = params.workflowInstanceId;
    }
    if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.slaInstance.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
        include: {
          policyDefinition: true,
          calendar: true,
        },
      }),
      this.prisma.slaInstance.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: Prisma.SlaInstanceCreateInput): Promise<SlaInstance> {
    return this.prisma.slaInstance.create({
      data,
      include: {
        policyDefinition: true,
        calendar: true,
      },
    });
  }

  async update(id: string, data: Prisma.SlaInstanceUpdateInput): Promise<SlaInstance> {
    return this.prisma.slaInstance.update({
      where: { id },
      data,
      include: {
        policyDefinition: true,
        calendar: true,
      },
    });
  }

  async findApproachingWarnings(now: Date, limit = 100): Promise<SlaInstance[]> {
    return this.prisma.slaInstance.findMany({
      where: {
        status: 'ACTIVE',
        warningNotified: false,
        warningAt: {
          lte: now,
        },
        dueAt: {
          gt: now,
        },
      },
      take: limit,
      include: {
        policyDefinition: true,
        calendar: true,
      },
    });
  }

  async findOverdueBreaches(now: Date, limit = 100): Promise<SlaInstance[]> {
    return this.prisma.slaInstance.findMany({
      where: {
        status: 'ACTIVE',
        dueAt: {
          lte: now,
        },
      },
      take: limit,
      include: {
        policyDefinition: true,
        calendar: true,
      },
    });
  }
}
