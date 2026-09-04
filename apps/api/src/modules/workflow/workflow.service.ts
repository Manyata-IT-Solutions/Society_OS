import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowDefinitionRepository } from './workflow-definition.repository.js';
import { WorkflowInstanceRepository } from './workflow-instance.repository.js';
import { WorkflowValidator } from './workflow-validator.js';
import { WorkflowRegistry } from './workflow-registry.js';
import { RuleService } from '../rule/rule.service.js';
import { ApprovalService } from '../approval/approval.service.js';
import { SlaService } from '../sla/sla.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS } from '@community-os/events';
import { createEvent } from '@community-os/events';
import type {
  Actor,
  ScopeType,
  WorkflowStatus,
  WorkflowInstanceStatus,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowTransitionHistory,
  AllowedWorkflowAction,
  WorkflowStateDescriptor,
  WorkflowTransitionDescriptor,
} from '@community-os/types';
import type { Prisma } from '@prisma/client';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly defRepo: WorkflowDefinitionRepository,
    private readonly instRepo: WorkflowInstanceRepository,
    private readonly validator: WorkflowValidator,
    private readonly registry: WorkflowRegistry,
    private readonly ruleService: RuleService,
    private readonly approvalService: ApprovalService,
    private readonly slaService: SlaService,
    private readonly eventBus: EventsService,
  ) {}

  // ===========================================================================
  // DEFINITION MANAGEMENT
  // ===========================================================================

  async createDefinitionDraft(
    data: {
      organizationId?: string | null;
      communityId?: string | null;
      scopeType?: 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY';
      key: string;
      name: string;
      description?: string;
      entityType: string;
      initialStateKey: string;
      states: WorkflowStateDescriptor[];
      transitions: WorkflowTransitionDescriptor[];
    },
    actor: Actor,
  ): Promise<WorkflowDefinition> {
    if (!this.registry.isResourceTypeAllowed(data.entityType)) {
      throw new BadRequestException(`Unregistered resource type "${data.entityType}"`);
    }

    this.validator.validateGraph(data.initialStateKey, data.states, data.transitions);

    const latestVersion = await this.defRepo.getLatestVersionNumber(
      data.organizationId,
      data.communityId,
      data.key,
    );

    const created = await this.defRepo.create({
      key: data.key,
      name: data.name,
      description: data.description,
      version: latestVersion + 1,
      scopeType: data.scopeType ?? 'PLATFORM',
      scopeId: data.communityId ?? data.organizationId ?? null,
      organization: data.organizationId ? { connect: { id: data.organizationId } } : undefined,
      community: data.communityId ? { connect: { id: data.communityId } } : undefined,
      status: 'DRAFT',
      entityType: data.entityType,
      initialStateKey: data.initialStateKey,
      states: data.states as unknown as Prisma.InputJsonValue,
      transitions: data.transitions as unknown as Prisma.InputJsonValue,
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    return this.mapDefToDomain(created);
  }

  async updateDefinitionDraft(
    id: string,
    data: {
      name?: string;
      description?: string;
      initialStateKey?: string;
      states?: WorkflowStateDescriptor[];
      transitions?: WorkflowTransitionDescriptor[];
    },
    _actor: Actor,
  ): Promise<WorkflowDefinition> {
    const existing = await this.defRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Workflow definition "${id}" not found`);
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(
        'Published or retired workflows are immutable. Create a new version to modify.',
      );
    }

    const initialStateKey = data.initialStateKey ?? existing.initialStateKey;
    const states = data.states ?? (existing.states as unknown as WorkflowStateDescriptor[]);
    const transitions =
      data.transitions ?? (existing.transitions as unknown as WorkflowTransitionDescriptor[]);

    this.validator.validateGraph(initialStateKey, states, transitions);

    const updated = await this.defRepo.update(id, {
      name: data.name,
      description: data.description,
      initialStateKey,
      states: states as unknown as Prisma.InputJsonValue,
      transitions: transitions as unknown as Prisma.InputJsonValue,
    });

    return this.mapDefToDomain(updated);
  }

  async publishDefinition(id: string, actor: Actor): Promise<WorkflowDefinition> {
    const existing = await this.defRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Workflow definition "${id}" not found`);
    }

    if (existing.status === 'PUBLISHED') return this.mapDefToDomain(existing);
    if (existing.status === 'RETIRED') {
      throw new BadRequestException('Cannot publish a retired workflow definition');
    }

    const states = existing.states as unknown as WorkflowStateDescriptor[];
    const transitions = existing.transitions as unknown as WorkflowTransitionDescriptor[];
    this.validator.validateGraph(existing.initialStateKey, states, transitions);

    const updated = await this.defRepo.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.WORKFLOW_DEFINITION_PUBLISHED,
        {
          workflowDefinitionId: updated.id,
          key: updated.key,
          version: updated.version,
          entityType: updated.entityType,
        },
        {
          organizationId: updated.organizationId ?? undefined,
          communityId: updated.communityId ?? undefined,
          userId: actor.id,
        },
      ),
    );

    return this.mapDefToDomain(updated);
  }

  async retireDefinition(id: string): Promise<WorkflowDefinition> {
    const updated = await this.defRepo.update(id, {
      status: 'RETIRED',
    });
    return this.mapDefToDomain(updated);
  }

  async cloneDefinitionVersion(id: string, actor: Actor): Promise<WorkflowDefinition> {
    const existing = await this.defRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Workflow definition "${id}" not found`);
    }

    const latestVersion = await this.defRepo.getLatestVersionNumber(
      existing.organizationId,
      existing.communityId,
      existing.key,
    );

    const created = await this.defRepo.create({
      key: existing.key,
      name: existing.name,
      description: existing.description,
      version: latestVersion + 1,
      scopeType: existing.scopeType,
      scopeId: existing.scopeId,
      organization: existing.organizationId
        ? { connect: { id: existing.organizationId } }
        : undefined,
      community: existing.communityId ? { connect: { id: existing.communityId } } : undefined,
      status: 'DRAFT',
      entityType: existing.entityType,
      initialStateKey: existing.initialStateKey,
      states: existing.states as Prisma.InputJsonValue,
      transitions: existing.transitions as Prisma.InputJsonValue,
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    return this.mapDefToDomain(created);
  }

  async getDefinitionById(id: string): Promise<WorkflowDefinition> {
    const def = await this.defRepo.findById(id);
    if (!def) {
      throw new NotFoundException(`Workflow definition "${id}" not found`);
    }
    return this.mapDefToDomain(def);
  }

  async listDefinitions(params: {
    organizationId?: string | null;
    communityId?: string | null;
    entityType?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
    skip?: number;
    take?: number;
  }): Promise<{ items: WorkflowDefinition[]; total: number }> {
    const res = await this.defRepo.list(params);
    return {
      items: res.items.map((i) => this.mapDefToDomain(i)),
      total: res.total,
    };
  }

  // ===========================================================================
  // RUNTIME INSTANCE EXECUTION
  // ===========================================================================

  async startInstance(params: {
    workflowDefinitionKey: string;
    workflowVersion?: number;
    organizationId?: string | null;
    communityId?: string | null;
    resourceType: string;
    resourceId: string;
    contextSnapshot?: Record<string, unknown>;
    actor: Actor;
    requestId?: string;
    correlationId?: string;
  }): Promise<WorkflowInstance> {
    let definition;
    if (params.workflowVersion) {
      definition = await this.defRepo.findByKeyAndVersion(
        params.organizationId,
        params.communityId,
        params.workflowDefinitionKey,
        params.workflowVersion,
      );
    } else {
      definition = await this.defRepo.findLatestPublished(
        params.organizationId,
        params.communityId,
        params.workflowDefinitionKey,
      );
    }

    if (!definition) {
      throw new NotFoundException(`Published Workflow "${params.workflowDefinitionKey}" not found`);
    }

    const now = new Date();
    const created = await this.instRepo.createInstanceWithHistory(
      {
        definition: { connect: { id: definition.id } },
        workflowDefinitionKey: definition.key,
        workflowVersion: definition.version,
        scopeType: definition.scopeType,
        organization: params.organizationId
          ? { connect: { id: params.organizationId } }
          : undefined,
        community: params.communityId ? { connect: { id: params.communityId } } : undefined,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        currentState: definition.initialStateKey,
        status: 'RUNNING',
        contextSnapshot: (params.contextSnapshot ?? {}) as Prisma.InputJsonValue,
        startedAt: now,
        lastTransitionAt: now,
        createdByUser: params.actor.id ? { connect: { id: params.actor.id } } : undefined,
      },
      {
        fromState: 'NONE',
        toState: definition.initialStateKey,
        action: 'START',
        actorId: params.actor.id,
        actorType: 'USER',
        reason: 'Workflow instance initialized',
        requestId: params.requestId,
        correlationId: params.correlationId,
        occurredAt: now,
      },
    );

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.WORKFLOW_STARTED,
        {
          workflowInstanceId: created.id,
          workflowDefinitionKey: created.workflowDefinitionKey,
          workflowVersion: created.workflowVersion,
          resourceType: created.resourceType,
          resourceId: created.resourceId,
          organizationId: created.organizationId,
          communityId: created.communityId,
          initialState: created.currentState,
        },
        {
          organizationId: created.organizationId ?? undefined,
          communityId: created.communityId ?? undefined,
          userId: params.actor.id,
        },
      ),
    );

    return this.mapInstToDomain(created);
  }

  async getAllowedActions(instanceId: string, _actor: Actor): Promise<AllowedWorkflowAction[]> {
    const inst = await this.instRepo.findById(instanceId);
    if (!inst) {
      throw new NotFoundException(`Workflow instance "${instanceId}" not found`);
    }

    if (inst.status !== 'RUNNING') return [];

    const transitions =
      (inst.definition.transitions as unknown as WorkflowTransitionDescriptor[]) || [];
    const validTransitions = transitions.filter((t) => t.fromState === inst.currentState);

    return validTransitions.map((t) => ({
      action: t.action,
      label: t.actionLabel ?? t.action,
      targetState: t.toState,
      requiresReason: t.reasonRequired ?? false,
      requiresComment: t.commentRequired ?? false,
      requiresApproval: !!t.approvalPolicyKey,
    }));
  }

  async transition(params: {
    instanceId: string;
    action: string;
    reason?: string;
    comment?: string;
    expectedVersion?: number;
    context?: Record<string, unknown>;
    actor: Actor;
    requestId?: string;
    correlationId?: string;
  }): Promise<WorkflowInstance> {
    const inst = await this.instRepo.findById(params.instanceId);
    if (!inst) {
      throw new NotFoundException(`Workflow instance "${params.instanceId}" not found`);
    }

    if (inst.status !== 'RUNNING') {
      throw new BadRequestException(`Cannot transition workflow in "${inst.status}" status`);
    }

    const definition = inst.definition;
    const states = definition.states as unknown as WorkflowStateDescriptor[];
    const transitions = definition.transitions as unknown as WorkflowTransitionDescriptor[];

    const transition = transitions.find(
      (t) => t.fromState === inst.currentState && t.action === params.action,
    );

    if (!transition) {
      throw new BadRequestException(
        `Action "${params.action}" is not allowed from current state "${inst.currentState}"`,
      );
    }

    // Check required reason
    if (transition.reasonRequired && !params.reason) {
      throw new BadRequestException(`Action "${params.action}" requires a reason`);
    }

    // Evaluate Guard Rule if defined
    let ruleSummary: Record<string, unknown> | null = null;
    if (transition.guardRuleKey) {
      const facts = {
        resource: {
          id: inst.resourceId,
          type: inst.resourceType,
          ...(params.context ?? {}),
        },
        actor: {
          id: params.actor.id,
          isPlatformAdmin: params.actor.isPlatformAdmin,
        },
        workflow: {
          currentState: inst.currentState,
          targetState: transition.toState,
        },
      };

      const ruleResult = await this.ruleService.evaluateRule(
        inst.organizationId,
        inst.communityId,
        transition.guardRuleKey,
        transition.guardRuleVersion,
        facts,
      );

      ruleSummary = {
        ruleKey: transition.guardRuleKey,
        passed: ruleResult.passed,
        evaluatedAt: ruleResult.evaluatedAt,
      };

      if (!ruleResult.passed) {
        throw new BadRequestException(
          `WORKFLOW_GUARD_FAILED: Guard rule "${transition.guardRuleKey}" did not pass.`,
        );
      }
    }

    // Determine target state and instance status
    const targetStateDescriptor = states.find((s) => s.key === transition.toState);
    let nextStatus: 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'SUSPENDED' = 'RUNNING';

    if (targetStateDescriptor) {
      if (targetStateDescriptor.type === 'COMPLETED') nextStatus = 'COMPLETED';
      else if (targetStateDescriptor.type === 'CANCELLED') nextStatus = 'CANCELLED';
      else if (targetStateDescriptor.type === 'FAILED') nextStatus = 'FAILED';
    }

    // Process Side Effects
    let createdApprovalId: string | null = null;
    if (transition.sideEffects && Array.isArray(transition.sideEffects)) {
      for (const effect of transition.sideEffects) {
        if (effect.type === 'START_APPROVAL' && effect.targetKey) {
          const appInst = await this.approvalService.startApproval({
            policyKey: effect.targetKey,
            organizationId: inst.organizationId,
            communityId: inst.communityId,
            resourceType: inst.resourceType,
            resourceId: inst.resourceId,
            workflowInstanceId: inst.id,
            requesterId: params.actor.id,
          });
          createdApprovalId = appInst.id;
        } else if (effect.type === 'START_SLA' && effect.targetKey) {
          await this.slaService.startSla({
            policyKey: effect.targetKey,
            organizationId: inst.organizationId,
            communityId: inst.communityId,
            resourceType: inst.resourceType,
            resourceId: inst.resourceId,
            workflowInstanceId: inst.id,
          });
        } else if (effect.type === 'COMPLETE_SLA') {
          const activeSla = await this.slaService.getActiveByWorkflow(inst.id);
          if (activeSla) {
            await this.slaService.completeSla(activeSla.id);
          }
        }
      }
    }

    const updated = await this.instRepo.transitionStateWithHistory(
      inst.id,
      params.expectedVersion,
      transition.toState,
      nextStatus,
      {
        fromState: inst.currentState,
        toState: transition.toState,
        action: params.action,
        actorId: params.actor.id,
        actorType: 'USER',
        reason: params.reason,
        comment: params.comment,
        requestId: params.requestId,
        correlationId: params.correlationId,
        ruleEvaluationSummary: ruleSummary as Prisma.InputJsonValue,
        approvalInstanceId: createdApprovalId,
        occurredAt: new Date(),
      },
      params.context ? { ...(inst.contextSnapshot as object), ...params.context } : undefined,
    );

    // Emit domain events
    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.WORKFLOW_TRANSITIONED,
        {
          workflowInstanceId: updated.id,
          workflowDefinitionKey: updated.workflowDefinitionKey,
          workflowVersion: updated.workflowVersion,
          resourceType: updated.resourceType,
          resourceId: updated.resourceId,
          organizationId: updated.organizationId,
          communityId: updated.communityId,
          fromState: inst.currentState,
          toState: transition.toState,
          action: params.action,
          actorId: params.actor.id,
        },
        {
          organizationId: updated.organizationId ?? undefined,
          communityId: updated.communityId ?? undefined,
          userId: params.actor.id,
        },
      ),
    );

    if (nextStatus === 'COMPLETED') {
      await this.eventBus.publish(
        createEvent(
          DOMAIN_EVENTS.WORKFLOW_COMPLETED,
          {
            workflowInstanceId: updated.id,
            workflowDefinitionKey: updated.workflowDefinitionKey,
            resourceType: updated.resourceType,
            resourceId: updated.resourceId,
            finalState: transition.toState,
          },
          {
            organizationId: updated.organizationId ?? undefined,
            communityId: updated.communityId ?? undefined,
            userId: params.actor.id,
          },
        ),
      );
    }

    return this.mapInstToDomain(updated);
  }

  async manualOverride(params: {
    instanceId: string;
    targetState: string;
    reason: string;
    comment?: string;
    expectedVersion?: number;
    actor: Actor;
    requestId?: string;
    correlationId?: string;
  }): Promise<WorkflowInstance> {
    const inst = await this.instRepo.findById(params.instanceId);
    if (!inst) {
      throw new NotFoundException(`Workflow instance "${params.instanceId}" not found`);
    }

    const definition = inst.definition;
    const states = definition.states as unknown as WorkflowStateDescriptor[];
    const targetStateDescriptor = states.find((s) => s.key === params.targetState);
    if (!targetStateDescriptor) {
      throw new BadRequestException(
        `Target state "${params.targetState}" does not exist in workflow definition`,
      );
    }

    let nextStatus: 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'SUSPENDED' = 'RUNNING';
    if (targetStateDescriptor.type === 'COMPLETED') nextStatus = 'COMPLETED';
    else if (targetStateDescriptor.type === 'CANCELLED') nextStatus = 'CANCELLED';

    const updated = await this.instRepo.transitionStateWithHistory(
      inst.id,
      params.expectedVersion,
      params.targetState,
      nextStatus,
      {
        fromState: inst.currentState,
        toState: params.targetState,
        action: 'MANUAL_OVERRIDE',
        actorId: params.actor.id,
        actorType: 'USER',
        reason: `[ADMIN OVERRIDE] ${params.reason}`,
        comment: params.comment,
        requestId: params.requestId,
        correlationId: params.correlationId,
        occurredAt: new Date(),
      },
    );

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.WORKFLOW_OVERRIDDEN,
        {
          workflowInstanceId: updated.id,
          resourceType: updated.resourceType,
          resourceId: updated.resourceId,
          previousState: inst.currentState,
          targetState: params.targetState,
          reason: params.reason,
          actorId: params.actor.id,
        },
        {
          organizationId: updated.organizationId ?? undefined,
          communityId: updated.communityId ?? undefined,
          userId: params.actor.id,
        },
      ),
    );

    return this.mapInstToDomain(updated);
  }

  async getInstanceById(
    id: string,
  ): Promise<WorkflowInstance & { history: WorkflowTransitionHistory[] }> {
    const inst = await this.instRepo.findById(id);
    if (!inst) {
      throw new NotFoundException(`Workflow instance "${id}" not found`);
    }
    return {
      ...this.mapInstToDomain(inst),
      history: inst.history.map((h) => this.mapHistoryToDomain(h)),
    };
  }

  async listInstances(params: {
    organizationId?: string | null;
    communityId?: string | null;
    resourceType?: string;
    resourceId?: string;
    status?: 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'SUSPENDED';
    workflowDefinitionKey?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: WorkflowInstance[]; total: number }> {
    const res = await this.instRepo.list(params);
    return {
      items: res.items.map((i) => this.mapInstToDomain(i)),
      total: res.total,
    };
  }

  private mapDefToDomain(d: Record<string, unknown>): WorkflowDefinition {
    return {
      id: d.id as string,
      key: d.key as string,
      name: d.name as string,
      description: d.description as string | null,
      version: d.version as number,
      scopeType: d.scopeType as ScopeType,
      scopeId: d.scopeId as string | null,
      organizationId: d.organizationId as string | null,
      communityId: d.communityId as string | null,
      status: d.status as WorkflowStatus,
      entityType: d.entityType as string,
      initialStateKey: d.initialStateKey as string,
      states: (d.states as unknown as WorkflowStateDescriptor[]) || [],
      transitions: (d.transitions as unknown as WorkflowTransitionDescriptor[]) || [],
      createdById: d.createdById as string | null,
      publishedAt: d.publishedAt as Date | null,
      createdAt: d.createdAt as Date,
      updatedAt: d.updatedAt as Date,
    };
  }

  private mapInstToDomain(i: Record<string, unknown>): WorkflowInstance {
    return {
      id: i.id as string,
      workflowDefinitionId: i.workflowDefinitionId as string,
      workflowDefinitionKey: i.workflowDefinitionKey as string,
      workflowVersion: i.workflowVersion as number,
      scopeType: i.scopeType as ScopeType,
      organizationId: i.organizationId as string | null,
      communityId: i.communityId as string | null,
      resourceType: i.resourceType as string,
      resourceId: i.resourceId as string,
      currentState: i.currentState as string,
      status: i.status as WorkflowInstanceStatus,
      contextSnapshot: (i.contextSnapshot ?? {}) as Record<string, unknown>,
      version: i.version as number,
      startedAt: i.startedAt as Date,
      completedAt: i.completedAt as Date | null,
      lastTransitionAt: i.lastTransitionAt as Date,
      createdById: i.createdById as string | null,
      createdAt: i.createdAt as Date,
      updatedAt: i.updatedAt as Date,
    };
  }

  private mapHistoryToDomain(h: Record<string, unknown>): WorkflowTransitionHistory {
    return {
      id: h.id as string,
      workflowInstanceId: h.workflowInstanceId as string,
      fromState: h.fromState as string,
      toState: h.toState as string,
      action: h.action as string,
      actorId: h.actorId as string | null,
      actorType: h.actorType as string,
      reason: h.reason as string | null,
      comment: h.comment as string | null,
      requestId: h.requestId as string | null,
      correlationId: h.correlationId as string | null,
      ruleEvaluationSummary: h.ruleEvaluationSummary as Record<string, unknown> | null,
      approvalInstanceId: h.approvalInstanceId as string | null,
      occurredAt: h.occurredAt as Date,
      createdAt: h.createdAt as Date,
    };
  }
}
