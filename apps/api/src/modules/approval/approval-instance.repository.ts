import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  Prisma,
  ApprovalInstance,
  ApprovalStepInstance,
  ApprovalDecision,
} from '@prisma/client';

@Injectable()
export class ApprovalInstanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: string,
  ): Promise<
    (ApprovalInstance & { steps: ApprovalStepInstance[]; decisions: ApprovalDecision[] }) | null
  > {
    return this.prisma.approvalInstance.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        decisions: { orderBy: { occurredAt: 'desc' } },
      },
    });
  }

  async findActiveByWorkflow(
    workflowInstanceId: string,
  ): Promise<(ApprovalInstance & { steps: ApprovalStepInstance[] }) | null> {
    return this.prisma.approvalInstance.findFirst({
      where: {
        workflowInstanceId,
        status: 'PENDING',
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });
  }

  async findStepById(
    stepId: string,
  ): Promise<(ApprovalStepInstance & { approvalInstance: ApprovalInstance }) | null> {
    return this.prisma.approvalStepInstance.findUnique({
      where: { id: stepId },
      include: {
        approvalInstance: true,
      },
    });
  }

  async findDecision(stepInstanceId: string, actorId: string): Promise<ApprovalDecision | null> {
    return this.prisma.approvalDecision.findUnique({
      where: {
        stepInstanceId_actorId: {
          stepInstanceId,
          actorId,
        },
      },
    });
  }

  async createInstanceWithSteps(
    instanceData: Prisma.ApprovalInstanceCreateInput,
    stepsData: Array<
      Omit<Prisma.ApprovalStepInstanceCreateManyApprovalInstanceInput, 'approvalInstanceId'>
    >,
  ): Promise<ApprovalInstance & { steps: ApprovalStepInstance[] }> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.approvalInstance.create({
        data: instanceData,
      });

      const stepsToInsert = stepsData.map((s) => ({
        ...s,
        approvalInstanceId: created.id,
      }));

      await tx.approvalStepInstance.createMany({
        data: stepsToInsert,
      });

      const steps = await tx.approvalStepInstance.findMany({
        where: { approvalInstanceId: created.id },
        orderBy: { stepOrder: 'asc' },
      });

      return { ...created, steps };
    });
  }

  async recordDecision(
    approvalInstanceId: string,
    stepInstanceId: string,
    decisionData: Prisma.ApprovalDecisionCreateInput,
    updatedStepData: Prisma.ApprovalStepInstanceUpdateInput,
    updatedInstanceData?: Prisma.ApprovalInstanceUpdateInput,
  ): Promise<{
    decision: ApprovalDecision;
    step: ApprovalStepInstance;
    instance: ApprovalInstance;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const decision = await tx.approvalDecision.create({
        data: decisionData,
      });

      const step = await tx.approvalStepInstance.update({
        where: { id: stepInstanceId },
        data: updatedStepData,
      });

      let instance = await tx.approvalInstance.findUniqueOrThrow({
        where: { id: approvalInstanceId },
      });

      if (updatedInstanceData) {
        instance = await tx.approvalInstance.update({
          where: { id: approvalInstanceId },
          data: {
            ...updatedInstanceData,
            version: { increment: 1 },
          },
        });
      }

      return { decision, step, instance };
    });
  }

  async listInboxForUser(params: {
    userId: string;
    organizationId?: string | null;
    communityId?: string | null;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
    skip?: number;
    take?: number;
  }): Promise<{
    items: Array<ApprovalStepInstance & { approvalInstance: ApprovalInstance }>;
    total: number;
  }> {
    const where: Prisma.ApprovalStepInstanceWhereInput = {
      status: params.status ?? 'PENDING',
      eligibleApproverIds: {
        array_contains: [params.userId],
      },
    };

    if (params.organizationId !== undefined || params.communityId !== undefined) {
      where.approvalInstance = {
        organizationId: params.organizationId ?? undefined,
        communityId: params.communityId ?? undefined,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.approvalStepInstance.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { openedAt: 'desc' },
        include: {
          approvalInstance: true,
        },
      }),
      this.prisma.approvalStepInstance.count({ where }),
    ]);

    return { items, total };
  }

  async list(params: {
    organizationId?: string | null;
    communityId?: string | null;
    resourceType?: string;
    resourceId?: string;
    workflowInstanceId?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    skip?: number;
    take?: number;
  }): Promise<{ items: ApprovalInstance[]; total: number }> {
    const where: Prisma.ApprovalInstanceWhereInput = {};
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
      this.prisma.approvalInstance.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalInstance.count({ where }),
    ]);

    return { items, total };
  }
}
