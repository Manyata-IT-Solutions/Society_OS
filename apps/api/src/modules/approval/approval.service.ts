import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApprovalPolicyRepository } from './approval-policy.repository.js';
import { ApprovalInstanceRepository } from './approval-instance.repository.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS } from '@community-os/events';
import { createEvent } from '@community-os/events';
import type {
  Actor,
  ActorType,
  ScopeType,
  ApprovalPolicyStatus,
  ApprovalInstanceStatus,
  ApprovalStepStatus,
  ApproverType,
  ApprovalQuorumMode,
  ApprovalDecisionType,
  ApprovalPolicyDefinition,
  ApprovalInstance,
  ApprovalStepInstance,
  ApprovalDecision,
  ApprovalStepDefinition,
} from '@community-os/types';
import type { MyApprovalInboxItemDto } from '@community-os/contracts';
import type { Prisma } from '@prisma/client';

@Injectable()
export class ApprovalService {
  constructor(
    private readonly policyRepo: ApprovalPolicyRepository,
    private readonly instanceRepo: ApprovalInstanceRepository,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventsService,
  ) {}

  // ===========================================================================
  // POLICY DEFINITIONS
  // ===========================================================================

  async createPolicyDraft(
    data: {
      organizationId?: string | null;
      communityId?: string | null;
      scopeType?: 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY';
      key: string;
      name: string;
      description?: string;
      steps: ApprovalStepDefinition[];
    },
    actor: Actor,
  ): Promise<ApprovalPolicyDefinition> {
    const latestVersion = await this.policyRepo.getLatestVersionNumber(
      data.organizationId,
      data.communityId,
      data.key,
    );

    const created = await this.policyRepo.create({
      key: data.key,
      name: data.name,
      description: data.description,
      version: latestVersion + 1,
      scopeType: data.scopeType ?? 'PLATFORM',
      scopeId: data.communityId ?? data.organizationId ?? null,
      organization: data.organizationId ? { connect: { id: data.organizationId } } : undefined,
      community: data.communityId ? { connect: { id: data.communityId } } : undefined,
      status: 'DRAFT',
      steps: data.steps as unknown as Prisma.InputJsonValue,
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    return this.mapPolicyToDomain(created);
  }

  async publishPolicy(id: string, _actor: Actor): Promise<ApprovalPolicyDefinition> {
    const existing = await this.policyRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Approval policy with ID "${id}" not found`);
    }

    if (existing.status === 'PUBLISHED') return this.mapPolicyToDomain(existing);
    if (existing.status === 'RETIRED') {
      throw new BadRequestException('Cannot publish a retired approval policy');
    }

    const updated = await this.policyRepo.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    return this.mapPolicyToDomain(updated);
  }

  async getPolicyById(id: string): Promise<ApprovalPolicyDefinition> {
    const existing = await this.policyRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Approval policy with ID "${id}" not found`);
    }
    return this.mapPolicyToDomain(existing);
  }

  async listPolicies(params: {
    organizationId?: string | null;
    communityId?: string | null;
    status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
    skip?: number;
    take?: number;
  }): Promise<{ items: ApprovalPolicyDefinition[]; total: number }> {
    const res = await this.policyRepo.list(params);
    return {
      items: res.items.map((i) => this.mapPolicyToDomain(i)),
      total: res.total,
    };
  }

  // ===========================================================================
  // RUNTIME APPROVAL INSTANCES
  // ===========================================================================

  async startApproval(params: {
    policyKey: string;
    policyVersion?: number;
    organizationId?: string | null;
    communityId?: string | null;
    resourceType: string;
    resourceId: string;
    workflowInstanceId?: string | null;
    requesterId?: string | null;
  }): Promise<ApprovalInstance> {
    let policy;
    if (params.policyVersion) {
      policy = await this.policyRepo.findByKeyAndVersion(
        params.organizationId,
        params.communityId,
        params.policyKey,
        params.policyVersion,
      );
    } else {
      policy = await this.policyRepo.findLatestPublished(
        params.organizationId,
        params.communityId,
        params.policyKey,
      );
    }

    if (!policy) {
      throw new NotFoundException(`Approval Policy "${params.policyKey}" not found`);
    }

    const steps = (policy.steps as unknown as ApprovalStepDefinition[]) || [];
    if (steps.length === 0) {
      throw new BadRequestException(`Approval Policy "${policy.key}" contains no approval steps`);
    }

    // Resolve eligible approvers for each step
    const stepRecords: Array<
      Omit<Prisma.ApprovalStepInstanceCreateManyApprovalInstanceInput, 'approvalInstanceId'>
    > = [];
    for (const step of steps) {
      const eligibleApproverIds = await this.resolveEligibleApprovers(
        step.approverType,
        step.approverValue,
        params.organizationId,
        params.communityId,
      );

      stepRecords.push({
        stepOrder: step.order,
        name: step.name,
        approverType: step.approverType,
        approverValue: step.approverValue,
        quorumMode: step.quorumMode,
        minCount: step.minCount ?? 1,
        status: step.order === 1 ? 'PENDING' : 'PENDING',
        eligibleApproverIds,
        requiredCount:
          step.quorumMode === 'ALL'
            ? Math.max(1, eligibleApproverIds.length)
            : (step.minCount ?? 1),
        approvedCount: 0,
        rejectedCount: 0,
        openedAt: new Date(),
      });
    }

    const created = await this.instanceRepo.createInstanceWithSteps(
      {
        workflowInstance: params.workflowInstanceId
          ? { connect: { id: params.workflowInstanceId } }
          : undefined,
        policyDefinition: { connect: { id: policy.id } },
        policyKey: policy.key,
        policyVersion: policy.version,
        organization: params.organizationId
          ? { connect: { id: params.organizationId } }
          : undefined,
        community: params.communityId ? { connect: { id: params.communityId } } : undefined,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        requesterUser: params.requesterId ? { connect: { id: params.requesterId } } : undefined,
        status: 'PENDING',
        currentStepOrder: 1,
        startedAt: new Date(),
      },
      stepRecords,
    );

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.APPROVAL_STARTED,
        {
          approvalInstanceId: created.id,
          policyKey: created.policyKey,
          policyVersion: created.policyVersion,
          resourceType: created.resourceType,
          resourceId: created.resourceId,
          workflowInstanceId: created.workflowInstanceId,
          organizationId: created.organizationId,
          communityId: created.communityId,
        },
        {
          organizationId: created.organizationId ?? undefined,
          communityId: created.communityId ?? undefined,
          userId: params.requesterId ?? undefined,
        },
      ),
    );

    return this.mapInstanceToDomain(created);
  }

  async submitDecision(
    stepInstanceId: string,
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    comment: string | undefined,
    actor: Actor,
    requestId?: string,
    correlationId?: string,
  ): Promise<{ decision: ApprovalDecision; approvalInstance: ApprovalInstance }> {
    const stepWithInst = await this.instanceRepo.findStepById(stepInstanceId);
    if (!stepWithInst) {
      throw new NotFoundException(`Approval step instance "${stepInstanceId}" not found`);
    }

    const inst = stepWithInst.approvalInstance;
    if (inst.status !== 'PENDING') {
      throw new BadRequestException(
        `Approval instance is not in PENDING state (current: ${inst.status})`,
      );
    }
    if (stepWithInst.status !== 'PENDING') {
      throw new BadRequestException(
        `Approval step is already completed (status: ${stepWithInst.status})`,
      );
    }

    // Load policy definition to check maker-checker & self-approval rule
    const policy = await this.policyRepo.findById(inst.policyDefinitionId);
    const policySteps = (policy?.steps as unknown as ApprovalStepDefinition[]) || [];
    const currentStepConfig = policySteps.find((s) => s.order === stepWithInst.stepOrder);

    // Enforce Maker-Checker & Self-Approval Prevention
    if (
      currentStepConfig &&
      currentStepConfig.allowSelfApproval === false &&
      inst.requesterId === actor.id
    ) {
      throw new ForbiddenException(
        'Self-approval is forbidden by policy (Maker-Checker violation).',
      );
    }

    // Check if actor already voted on this step
    const existingDecision = await this.instanceRepo.findDecision(stepInstanceId, actor.id);
    if (existingDecision) {
      throw new BadRequestException(
        'Actor has already submitted a decision on this approval step.',
      );
    }

    // Check eligibility
    const eligibleIds = (stepWithInst.eligibleApproverIds as string[]) || [];
    if (!actor.isPlatformAdmin && eligibleIds.length > 0 && !eligibleIds.includes(actor.id)) {
      throw new ForbiddenException('Actor is not an eligible approver for this step.');
    }

    const now = new Date();
    let newApprovedCount = stepWithInst.approvedCount;
    let newRejectedCount = stepWithInst.rejectedCount;
    let newStepStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' = stepWithInst.status;
    let newInstanceStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' = inst.status;

    if (decision === 'APPROVE') {
      newApprovedCount++;
      if (
        stepWithInst.quorumMode === 'ANY_ONE' ||
        (stepWithInst.quorumMode === 'ALL' && newApprovedCount >= stepWithInst.requiredCount) ||
        (stepWithInst.quorumMode === 'MIN_COUNT' && newApprovedCount >= stepWithInst.minCount)
      ) {
        newStepStatus = 'APPROVED';
      }
    } else {
      newRejectedCount++;
      newStepStatus = 'REJECTED';
      newInstanceStatus = 'REJECTED';
    }

    let nextStepOrder = inst.currentStepOrder;
    if (newStepStatus === 'APPROVED') {
      const totalSteps = policySteps.length;
      if (stepWithInst.stepOrder >= totalSteps) {
        newInstanceStatus = 'APPROVED';
      } else {
        nextStepOrder = stepWithInst.stepOrder + 1;
      }
    }

    const { decision: recordedDec, instance: updatedInst } = await this.instanceRepo.recordDecision(
      inst.id,
      stepInstanceId,
      {
        approvalInstance: { connect: { id: inst.id } },
        stepInstance: { connect: { id: stepInstanceId } },
        actorUser: { connect: { id: actor.id } },
        actorType: 'USER',
        decision,
        comment,
        requestId,
        correlationId,
        occurredAt: now,
      },
      {
        approvedCount: newApprovedCount,
        rejectedCount: newRejectedCount,
        status: newStepStatus,
        completedAt: newStepStatus !== 'PENDING' ? now : null,
      },
      {
        status: newInstanceStatus,
        currentStepOrder: nextStepOrder,
        completedAt: newInstanceStatus !== 'PENDING' ? now : null,
      },
    );

    // Emit decision event
    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.APPROVAL_DECISION_RECORDED,
        {
          approvalInstanceId: inst.id,
          stepInstanceId,
          actorId: actor.id,
          decision,
          comment,
        },
        {
          organizationId: inst.organizationId ?? undefined,
          communityId: inst.communityId ?? undefined,
          userId: actor.id,
        },
      ),
    );

    if (newInstanceStatus === 'APPROVED') {
      await this.eventBus.publish(
        createEvent(
          DOMAIN_EVENTS.APPROVAL_APPROVED,
          {
            approvalInstanceId: inst.id,
            policyKey: inst.policyKey,
            resourceType: inst.resourceType,
            resourceId: inst.resourceId,
            workflowInstanceId: inst.workflowInstanceId,
          },
          {
            organizationId: inst.organizationId ?? undefined,
            communityId: inst.communityId ?? undefined,
            userId: actor.id,
          },
        ),
      );
    } else if (newInstanceStatus === 'REJECTED') {
      await this.eventBus.publish(
        createEvent(
          DOMAIN_EVENTS.APPROVAL_REJECTED,
          {
            approvalInstanceId: inst.id,
            policyKey: inst.policyKey,
            resourceType: inst.resourceType,
            resourceId: inst.resourceId,
            workflowInstanceId: inst.workflowInstanceId,
            rejectionBehavior: currentStepConfig?.rejectionBehavior ?? 'TERMINATE_WORKFLOW',
          },
          {
            organizationId: inst.organizationId ?? undefined,
            communityId: inst.communityId ?? undefined,
            userId: actor.id,
          },
        ),
      );
    }

    return {
      decision: this.mapDecisionToDomain(recordedDec),
      approvalInstance: this.mapInstanceToDomain(updatedInst),
    };
  }

  async getActiveByWorkflow(workflowInstanceId: string): Promise<ApprovalInstance | null> {
    const rec = await this.instanceRepo.findActiveByWorkflow(workflowInstanceId);
    return rec ? this.mapInstanceToDomain(rec) : null;
  }

  async getById(
    id: string,
  ): Promise<ApprovalInstance & { steps: ApprovalStepInstance[]; decisions: ApprovalDecision[] }> {
    const rec = await this.instanceRepo.findById(id);
    if (!rec) {
      throw new NotFoundException(`Approval instance with ID "${id}" not found`);
    }
    return {
      ...this.mapInstanceToDomain(rec),
      steps: rec.steps.map((s) => this.mapStepToDomain(s)),
      decisions: rec.decisions.map((d) => this.mapDecisionToDomain(d)),
    };
  }

  async listInbox(
    actor: Actor,
    params: {
      organizationId?: string | null;
      communityId?: string | null;
      status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
      skip?: number;
      take?: number;
    },
  ): Promise<{ items: MyApprovalInboxItemDto[]; total: number }> {
    const res = await this.instanceRepo.listInboxForUser({
      userId: actor.id,
      organizationId: params.organizationId,
      communityId: params.communityId,
      status: params.status,
      skip: params.skip,
      take: params.take,
    });

    return {
      items: res.items.map((i) => ({
        approvalInstanceId: i.approvalInstanceId,
        stepInstanceId: i.id,
        policyKey: i.approvalInstance.policyKey,
        stepName: i.name,
        stepOrder: i.stepOrder,
        resourceType: i.approvalInstance.resourceType,
        resourceId: i.approvalInstance.resourceId,
        requesterId: i.approvalInstance.requesterId,
        organizationId: i.approvalInstance.organizationId,
        communityId: i.approvalInstance.communityId,
        status: i.status,
        openedAt: i.openedAt.toISOString(),
        dueAt: null,
      })),
      total: res.total,
    };
  }

  private async resolveEligibleApprovers(
    type: 'ROLE' | 'PERMISSION' | 'SPECIFIC_USER' | 'RESOURCE_RELATION',
    value: string,
    organizationId?: string | null,
    communityId?: string | null,
  ): Promise<string[]> {
    if (type === 'SPECIFIC_USER') {
      return [value];
    }

    const scopeConditions = [
      { scopeType: 'PLATFORM' as const },
      ...(organizationId ? [{ scopeType: 'ORGANIZATION' as const, scopeId: organizationId }] : []),
      ...(communityId ? [{ scopeType: 'COMMUNITY' as const, scopeId: communityId }] : []),
    ];

    if (type === 'ROLE') {
      const assignments = await this.prisma.roleAssignment.findMany({
        where: {
          role: { code: value },
          status: 'ACTIVE',
          OR: scopeConditions,
        },
        select: { userId: true },
      });
      return Array.from(new Set(assignments.map((a) => a.userId)));
    }

    if (type === 'PERMISSION') {
      const assignments = await this.prisma.roleAssignment.findMany({
        where: {
          role: {
            permissions: {
              some: {
                permission: { code: value },
              },
            },
          },
          status: 'ACTIVE',
          OR: scopeConditions,
        },
        select: { userId: true },
      });
      return Array.from(new Set(assignments.map((a) => a.userId)));
    }

    return [];
  }

  private mapPolicyToDomain(p: Record<string, unknown>): ApprovalPolicyDefinition {
    return {
      id: p.id as string,
      key: p.key as string,
      name: p.name as string,
      description: p.description as string | null,
      version: p.version as number,
      scopeType: p.scopeType as ScopeType,
      scopeId: p.scopeId as string | null,
      organizationId: p.organizationId as string | null,
      communityId: p.communityId as string | null,
      status: p.status as ApprovalPolicyStatus,
      steps: (p.steps as unknown as ApprovalStepDefinition[]) || [],
      createdById: p.createdById as string | null,
      publishedAt: p.publishedAt as Date | null,
      createdAt: p.createdAt as Date,
      updatedAt: p.updatedAt as Date,
    };
  }

  private mapInstanceToDomain(i: Record<string, unknown>): ApprovalInstance {
    return {
      id: i.id as string,
      workflowInstanceId: i.workflowInstanceId as string | null,
      policyDefinitionId: i.policyDefinitionId as string,
      policyKey: i.policyKey as string,
      policyVersion: i.policyVersion as number,
      organizationId: i.organizationId as string | null,
      communityId: i.communityId as string | null,
      resourceType: i.resourceType as string,
      resourceId: i.resourceId as string,
      requesterId: i.requesterId as string | null,
      status: i.status as ApprovalInstanceStatus,
      currentStepOrder: i.currentStepOrder as number,
      startedAt: i.startedAt as Date,
      completedAt: i.completedAt as Date | null,
      version: i.version as number,
      createdAt: i.createdAt as Date,
      updatedAt: i.updatedAt as Date,
    };
  }

  private mapStepToDomain(s: Record<string, unknown>): ApprovalStepInstance {
    return {
      id: s.id as string,
      approvalInstanceId: s.approvalInstanceId as string,
      stepOrder: s.stepOrder as number,
      name: s.name as string,
      approverType: s.approverType as ApproverType,
      approverValue: s.approverValue as string,
      quorumMode: s.quorumMode as ApprovalQuorumMode,
      minCount: s.minCount as number,
      status: s.status as ApprovalStepStatus,
      eligibleApproverIds: (s.eligibleApproverIds as string[]) || [],
      requiredCount: s.requiredCount as number | null,
      approvedCount: s.approvedCount as number,
      rejectedCount: s.rejectedCount as number,
      openedAt: s.openedAt as Date,
      completedAt: s.completedAt as Date | null,
      createdAt: s.createdAt as Date,
      updatedAt: s.updatedAt as Date,
    };
  }

  private mapDecisionToDomain(d: Record<string, unknown>): ApprovalDecision {
    return {
      id: d.id as string,
      approvalInstanceId: d.approvalInstanceId as string,
      stepInstanceId: d.stepInstanceId as string,
      actorId: d.actorId as string,
      actorType: (d.actorType ?? 'USER') as ActorType,
      decision: d.decision as ApprovalDecisionType,
      comment: d.comment as string | null,
      requestId: d.requestId as string | null,
      correlationId: d.correlationId as string | null,
      occurredAt: d.occurredAt as Date,
      createdAt: d.createdAt as Date,
    };
  }
}
