import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  Prisma,
  WorkflowInstance,
  WorkflowDefinition,
  WorkflowTransitionHistory,
} from '@prisma/client';

@Injectable()
export class WorkflowInstanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: string,
  ): Promise<
    | (WorkflowInstance & { definition: WorkflowDefinition; history: WorkflowTransitionHistory[] })
    | null
  > {
    return this.prisma.workflowInstance.findUnique({
      where: { id },
      include: {
        definition: true,
        history: { orderBy: { occurredAt: 'desc' } },
      },
    });
  }

  async findActiveByResource(
    resourceType: string,
    resourceId: string,
  ): Promise<(WorkflowInstance & { definition: WorkflowDefinition }) | null> {
    return this.prisma.workflowInstance.findFirst({
      where: {
        resourceType,
        resourceId,
        status: 'RUNNING',
      },
      include: {
        definition: true,
      },
    });
  }

  async createInstanceWithHistory(
    instanceData: Prisma.WorkflowInstanceCreateInput,
    historyData: Omit<
      Prisma.WorkflowTransitionHistoryCreateManyWorkflowInstanceInput,
      'workflowInstanceId'
    >,
  ): Promise<WorkflowInstance> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.workflowInstance.create({
        data: instanceData,
      });

      await tx.workflowTransitionHistory.create({
        data: {
          ...historyData,
          workflowInstanceId: created.id,
        },
      });

      return created;
    });
  }

  async transitionStateWithHistory(
    instanceId: string,
    expectedVersion: number | undefined,
    toState: string,
    instanceStatus: 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'SUSPENDED',
    historyData: Omit<
      Prisma.WorkflowTransitionHistoryCreateManyWorkflowInstanceInput,
      'workflowInstanceId'
    >,
    contextSnapshot?: Record<string, unknown>,
  ): Promise<WorkflowInstance> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.workflowInstance.findUniqueOrThrow({
        where: { id: instanceId },
      });

      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new ConflictException(
          `WORKFLOW_CONCURRENCY_CONFLICT: Version mismatch (expected ${expectedVersion}, current ${current.version})`,
        );
      }

      const now = new Date();
      const updated = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          currentState: toState,
          status: instanceStatus,
          lastTransitionAt: now,
          completedAt:
            instanceStatus === 'COMPLETED' || instanceStatus === 'CANCELLED' ? now : undefined,
          contextSnapshot: contextSnapshot ? (contextSnapshot as Prisma.InputJsonValue) : undefined,
          version: { increment: 1 },
        },
      });

      await tx.workflowTransitionHistory.create({
        data: {
          ...historyData,
          workflowInstanceId: instanceId,
        },
      });

      return updated;
    });
  }

  async list(params: {
    organizationId?: string | null;
    communityId?: string | null;
    resourceType?: string;
    resourceId?: string;
    status?: 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'SUSPENDED';
    workflowDefinitionKey?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: WorkflowInstance[]; total: number }> {
    const where: Prisma.WorkflowInstanceWhereInput = {};
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
    if (params.status) {
      where.status = params.status;
    }
    if (params.workflowDefinitionKey) {
      where.workflowDefinitionKey = params.workflowDefinitionKey;
    }

    const [items, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { lastTransitionAt: 'desc' },
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);

    return { items, total };
  }

  async listHistory(workflowInstanceId: string): Promise<WorkflowTransitionHistory[]> {
    return this.prisma.workflowTransitionHistory.findMany({
      where: { workflowInstanceId },
      orderBy: { occurredAt: 'desc' },
    });
  }
}
