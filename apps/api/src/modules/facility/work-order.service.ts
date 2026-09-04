import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { WorkOrderRepository, WorkOrderWithRelations } from './work-order.repository.js';
import { WorkOrderSequenceService } from './work-order-sequence.service.js';
import { FacilityCategoryRepository } from './facility-category.repository.js';
import { ChecklistTemplateRepository } from './checklist-template.repository.js';
import { WorkflowService } from '../workflow/workflow.service.js';
import { SlaService } from '../sla/sla.service.js';
import { CustomFieldService } from '../custom-field/custom-field.service.js';
import { AuditService } from '../audit/audit.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  Actor,
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderLocationType,
  WorkOrderSource,
  WorkOrderFilterParams,
  WorkOrderTaskStatus,
  ChecklistItemType,
  WorkLogType,
  WorkEvidenceType,
  WorkOrderBlockerReason,
  TicketWorkOrderRelationType,
  FacilityKpiMetrics,
} from '@community-os/types';

export interface CreateWorkOrderInput {
  organizationId: string;
  communityId: string;
  title: string;
  description: string;
  workType?: WorkOrderType;
  priority?: WorkOrderPriority;
  categoryId?: string | null;
  locationType?: WorkOrderLocationType;
  propertySectionId?: string | null;
  buildingId?: string | null;
  floorId?: string | null;
  unitId?: string | null;
  locationDescription?: string | null;
  source?: WorkOrderSource;
  maintenancePlanId?: string | null;
  planVersion?: number | null;
  scheduledOccurrenceAt?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  dueAt?: string | null;
  primaryTeamId?: string | null;
  primaryAssigneeId?: string | null;
  workflowDefinitionKey?: string;
  checklistTemplateId?: string | null;
  tasks?: Array<{
    title: string;
    description?: string | null;
    sequence?: number;
    isRequired?: boolean;
  }>;
  ticketId?: string | null;
  ticketRelationshipType?: TicketWorkOrderRelationType;
  customFields?: Record<string, unknown>;
}

@Injectable()
export class WorkOrderService {
  private readonly logger = new Logger(WorkOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workOrderRepo: WorkOrderRepository,
    private readonly sequenceService: WorkOrderSequenceService,
    private readonly categoryRepo: FacilityCategoryRepository,
    private readonly checklistRepo: ChecklistTemplateRepository,
    private readonly workflowService: WorkflowService,
    private readonly slaService: SlaService,
    private readonly customFieldService: CustomFieldService,
    private readonly auditService: AuditService,
    private readonly eventsService: EventsService,
  ) {}

  async createWorkOrder(
    input: CreateWorkOrderInput,
    actor?: Actor,
  ): Promise<WorkOrderWithRelations> {
    const workOrderNumber = await this.sequenceService.nextWorkOrderNumber(
      input.organizationId,
      input.communityId,
    );

    // Resolve category default SLA and team if not provided
    let defaultSlaPolicyId: string | null = null;
    let defaultTeamId = input.primaryTeamId ?? null;
    if (input.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (category) {
        defaultSlaPolicyId = category.defaultSlaPolicyId ?? null;
        if (!defaultTeamId && category.defaultTeamId) {
          defaultTeamId = category.defaultTeamId;
        }
      }
    }

    // Workflow initialization via Phase 7 Workflow Engine
    const workflowKey = input.workflowDefinitionKey || 'workflow.work_order.standard';
    const effectiveActor: Actor = actor || {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'system@communityos.internal',
      displayName: 'System Process',
      isPlatformAdmin: true,
      sessionId: '00000000-0000-0000-0000-000000000000',
    };

    const workflowInstance = await this.workflowService.startInstance({
      workflowDefinitionKey: workflowKey,
      resourceType: 'WORK_ORDER',
      resourceId: '00000000-0000-0000-0000-000000000000',
      organizationId: input.organizationId,
      communityId: input.communityId,
      contextSnapshot: {
        workOrderNumber,
        title: input.title,
        priority: input.priority ?? 'NORMAL',
        workType: input.workType ?? 'CORRECTIVE',
        source: input.source ?? 'MANUAL',
      },
      actor: effectiveActor,
    });

    const workOrder = await this.workOrderRepo.create({
      organizationId: input.organizationId,
      communityId: input.communityId,
      workOrderNumber,
      title: input.title,
      description: input.description,
      workType: input.workType ?? 'CORRECTIVE',
      priority: input.priority ?? 'NORMAL',
      categoryId: input.categoryId ?? null,
      locationType: input.locationType ?? 'COMMON_AREA',
      propertySectionId: input.propertySectionId ?? null,
      buildingId: input.buildingId ?? null,
      floorId: input.floorId ?? null,
      unitId: input.unitId ?? null,
      locationDescription: input.locationDescription ?? null,
      source: input.source ?? 'MANUAL',
      maintenancePlanId: input.maintenancePlanId ?? null,
      planVersion: input.planVersion ?? null,
      scheduledOccurrenceAt: input.scheduledOccurrenceAt
        ? new Date(input.scheduledOccurrenceAt)
        : null,
      workflowInstanceId: workflowInstance.id,
      currentState: workflowInstance.currentState,
      scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : null,
      scheduledEndAt: input.scheduledEndAt ? new Date(input.scheduledEndAt) : null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      primaryTeamId: defaultTeamId,
      primaryAssigneeId: input.primaryAssigneeId ?? null,
      createdById: actor?.id ?? null,
    });

    // Start SLA if policy found
    if (defaultSlaPolicyId) {
      try {
        const slaPolicy = await this.prisma.slaPolicyDefinition.findUnique({
          where: { id: defaultSlaPolicyId },
        });
        if (slaPolicy) {
          const slaInstance = await this.slaService.startSla({
            policyKey: slaPolicy.key,
            policyVersion: slaPolicy.version,
            resourceType: 'WORK_ORDER',
            resourceId: workOrder.id,
            workflowInstanceId: workflowInstance.id,
            organizationId: input.organizationId,
            communityId: input.communityId,
          });

          await this.workOrderRepo.update(workOrder.id, {
            slaStatus: slaInstance.status,
            slaDueAt: slaInstance.dueAt,
          });
        }
      } catch (err) {
        this.logger.warn(`Could not start SLA for WorkOrder ${workOrder.id}: ${err}`);
      }
    }

    // Link Ticket if provided
    if (input.ticketId) {
      await this.workOrderRepo.linkTicket({
        ticketId: input.ticketId,
        workOrderId: workOrder.id,
        relationshipType: input.ticketRelationshipType ?? 'GENERATED_FROM',
        createdById: actor?.id ?? null,
      });

      this.eventsService.publish(
        createEvent(DOMAIN_EVENTS.WORK_ORDER_LINKED_TO_TICKET, {
          workOrderId: workOrder.id,
          ticketId: input.ticketId,
          relationshipType: input.ticketRelationshipType ?? 'GENERATED_FROM',
          organizationId: input.organizationId,
          communityId: input.communityId,
        }),
      );
    }

    // Snapshot Checklist Template if specified
    if (input.checklistTemplateId) {
      const template = await this.checklistRepo.findById(input.checklistTemplateId);
      if (template && Array.isArray(template.items)) {
        for (const item of template.items) {
          await this.workOrderRepo.upsertChecklistResult({
            workOrderId: workOrder.id,
            checklistTemplateId: template.id,
            templateVersion: template.version,
            itemId: item.id,
            itemLabel: item.label,
            itemType: item.itemType,
            isRequired: item.isRequired,
          });
        }
      }
    }

    // Add Tasks if specified
    if (input.tasks && input.tasks.length > 0) {
      for (const t of input.tasks) {
        await this.workOrderRepo.addTask({
          workOrderId: workOrder.id,
          title: t.title,
          description: t.description ?? null,
          sequence: t.sequence ?? 1,
          isRequired: t.isRequired ?? true,
        });
      }
    }

    // Save Custom Fields
    if (input.customFields) {
      try {
        const valuesList = Object.entries(input.customFields).map(([definitionId, value]) => ({
          definitionId,
          value,
        }));
        await this.customFieldService.setEntityValues(
          'WORK_ORDER',
          workOrder.id,
          { values: valuesList },
          {
            userId: actor?.id || '00000000-0000-0000-0000-000000000000',
            organizationId: input.organizationId,
            communityId: input.communityId,
          },
        );
      } catch (err) {
        this.logger.warn(`Could not save custom fields for work order ${workOrder.id}: ${err}`);
      }
    }

    // Audit Log & Event
    await this.auditService.record({
      organizationId: input.organizationId,
      communityId: input.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id ?? '00000000-0000-0000-0000-000000000000',
      sessionId: actor?.sessionId,
      action: 'WORK_ORDER_CREATED',
      resourceType: 'WORK_ORDER',
      resourceId: workOrder.id,
      metadata: {
        workOrderNumber,
        title: input.title,
        priority: input.priority ?? 'NORMAL',
        workType: input.workType ?? 'CORRECTIVE',
      },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_CREATED, {
        workOrderId: workOrder.id,
        workOrderNumber,
        title: input.title,
        workType: input.workType ?? 'CORRECTIVE',
        priority: input.priority ?? 'NORMAL',
        organizationId: input.organizationId,
        communityId: input.communityId,
        actorId: actor?.id,
      }),
    );

    return (await this.workOrderRepo.findById(workOrder.id))!;
  }

  async getWorkOrderById(id: string): Promise<WorkOrderWithRelations> {
    const workOrder = await this.workOrderRepo.findById(id);
    if (!workOrder) {
      throw new DomainException(
        'WORK_ORDER_NOT_FOUND',
        `Work order with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return workOrder;
  }

  async listWorkOrders(filters: WorkOrderFilterParams): Promise<{
    items: WorkOrderWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.workOrderRepo.findMany(filters);
  }

  async getAllowedActions(
    id: string,
    actor?: Actor,
  ): Promise<Array<{ action: string; label: string; toState: string }>> {
    const workOrder = await this.getWorkOrderById(id);
    const effectiveActor: Actor = actor || {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'system@communityos.internal',
      displayName: 'System Process',
      isPlatformAdmin: true,
      sessionId: '00000000-0000-0000-0000-000000000000',
    };
    const actions = await this.workflowService.getAllowedActions(
      workOrder.workflowInstanceId,
      effectiveActor,
    );
    return (actions as any[]).map((a) => ({
      action: String(a.action),
      label: String(a.label),
      toState: String(
        (a as unknown as Record<string, unknown>).targetState ||
          (a as unknown as Record<string, unknown>).toState ||
          '',
      ),
    }));
  }

  async executeWorkflowAction(
    id: string,
    action: string,
    reason?: string,
    comment?: string,
    actor?: Actor,
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);
    const effectiveActor: Actor = actor || {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'system@communityos.internal',
      displayName: 'System Process',
      isPlatformAdmin: true,
      sessionId: '00000000-0000-0000-0000-000000000000',
    };

    const result = await this.workflowService.transition({
      instanceId: workOrder.workflowInstanceId,
      action,
      reason,
      comment,
      actor: effectiveActor,
    });

    await this.workOrderRepo.update(id, {
      currentState: result.currentState,
      version: (workOrder.version || 1) + 1,
    });

    await this.auditService.record({
      organizationId: workOrder.organizationId,
      communityId: workOrder.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id ?? '00000000-0000-0000-0000-000000000000',
      sessionId: actor?.sessionId,
      action: 'WORK_ORDER_WORKFLOW_TRANSITION',
      resourceType: 'WORK_ORDER',
      resourceId: id,
      metadata: {
        toState: result.currentState,
        action,
        reason,
      },
    });

    return (await this.workOrderRepo.findById(id))!;
  }

  async assignWorkOrder(
    id: string,
    teamId?: string | null,
    assigneeId?: string | null,
    reason?: string,
    actor?: Actor,
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);

    await this.workOrderRepo.recordAssignment({
      workOrderId: id,
      fromTeamId: workOrder.primaryTeamId,
      toTeamId: teamId !== undefined ? teamId : workOrder.primaryTeamId,
      fromUserId: workOrder.primaryAssigneeId,
      toUserId: assigneeId !== undefined ? assigneeId : workOrder.primaryAssigneeId,
      assignedById: actor?.id ?? '00000000-0000-0000-0000-000000000000',
      reason,
    });

    let nextState = workOrder.currentState;
    if (workOrder.currentState === 'DRAFT' || workOrder.currentState === 'PLANNED') {
      nextState = 'ASSIGNED';
    }

    await this.workOrderRepo.update(id, {
      ...(teamId !== undefined ? { primaryTeamId: teamId } : {}),
      ...(assigneeId !== undefined ? { primaryAssigneeId: assigneeId } : {}),
      currentState: nextState,
      version: (workOrder.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_ASSIGNED, {
        workOrderId: id,
        teamId,
        assigneeId,
        organizationId: workOrder.organizationId,
        communityId: workOrder.communityId,
        actorId: actor?.id,
      }),
    );

    return (await this.workOrderRepo.findById(id))!;
  }

  async claimWorkOrder(id: string, actor: Actor): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.primaryAssigneeId && workOrder.primaryAssigneeId !== actor.id) {
      throw new DomainException(
        'WORK_ORDER_ALREADY_CLAIMED',
        `Work order ${workOrder.workOrderNumber} is already claimed by another technician.`,
        HttpStatus.CONFLICT,
      );
    }

    await this.workOrderRepo.recordAssignment({
      workOrderId: id,
      fromTeamId: workOrder.primaryTeamId,
      toTeamId: workOrder.primaryTeamId,
      fromUserId: workOrder.primaryAssigneeId,
      toUserId: actor.id,
      assignedById: actor.id,
      reason: 'Technician self-claimed from team queue',
    });

    let nextState = workOrder.currentState;
    if (
      workOrder.currentState === 'DRAFT' ||
      workOrder.currentState === 'PLANNED' ||
      workOrder.currentState === 'ASSIGNED'
    ) {
      nextState = 'ACCEPTED';
    }

    await this.workOrderRepo.update(id, {
      primaryAssigneeId: actor.id,
      isAccepted: true,
      acceptedAt: new Date(),
      currentState: nextState,
      version: (workOrder.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_ACCEPTED, {
        workOrderId: id,
        technicianId: actor.id,
        organizationId: workOrder.organizationId,
        communityId: workOrder.communityId,
      }),
    );

    return (await this.workOrderRepo.findById(id))!;
  }

  async startWork(id: string, actor: Actor): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);

    await this.workOrderRepo.update(id, {
      actualStartAt: workOrder.actualStartAt ? new Date(workOrder.actualStartAt) : new Date(),
      currentState: 'IN_PROGRESS',
      isPaused: false,
      isBlocked: false,
      version: (workOrder.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_STARTED, {
        workOrderId: id,
        actorId: actor.id,
        organizationId: workOrder.organizationId,
        communityId: workOrder.communityId,
      }),
    );

    return (await this.workOrderRepo.findById(id))!;
  }

  async pauseWork(id: string, actor: Actor): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);

    await this.workOrderRepo.update(id, {
      isPaused: true,
      pausedAt: new Date(),
      currentState: 'PAUSED',
      version: (workOrder.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_PAUSED, {
        workOrderId: id,
        actorId: actor.id,
        organizationId: workOrder.organizationId,
        communityId: workOrder.communityId,
      }),
    );

    return (await this.workOrderRepo.findById(id))!;
  }

  async resumeWork(id: string, actor: Actor): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);

    await this.workOrderRepo.update(id, {
      isPaused: false,
      isBlocked: false,
      currentState: 'IN_PROGRESS',
      version: (workOrder.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_RESUMED, {
        workOrderId: id,
        actorId: actor.id,
        organizationId: workOrder.organizationId,
        communityId: workOrder.communityId,
      }),
    );

    return (await this.workOrderRepo.findById(id))!;
  }

  async blockWork(
    id: string,
    reason: string,
    category: WorkOrderBlockerReason = 'OTHER',
    actor: Actor,
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);

    await this.workOrderRepo.update(id, {
      isBlocked: true,
      blockedReason: reason,
      blockedCategory: category,
      blockedAt: new Date(),
      currentState: 'BLOCKED',
      version: (workOrder.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_BLOCKED, {
        workOrderId: id,
        reason,
        category,
        actorId: actor.id,
        organizationId: workOrder.organizationId,
        communityId: workOrder.communityId,
      }),
    );

    return (await this.workOrderRepo.findById(id))!;
  }

  async completeWork(
    id: string,
    completionSummary: string,
    resolutionCode?: string | null,
    actor?: Actor,
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);

    // Validate no active timer
    if (actor) {
      const activeTimer = await this.workOrderRepo.findActiveWorkLog(actor.id);
      if (activeTimer && (activeTimer as any).workOrderId === id) {
        throw new DomainException(
          'WORK_ORDER_ACTIVE_TIMER_EXISTS',
          'Cannot complete work order while a live timer is running. Please stop your timer first.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validate required tasks are completed
    if (workOrder.tasks && workOrder.tasks.length > 0) {
      const pendingRequiredTasks = workOrder.tasks.filter(
        (t) => t.isRequired && t.status !== 'COMPLETED' && t.status !== 'SKIPPED',
      );
      if (pendingRequiredTasks.length > 0) {
        throw new DomainException(
          'WORK_ORDER_REQUIRED_TASKS_INCOMPLETE',
          `Cannot complete work order: ${pendingRequiredTasks.length} required task(s) remain incomplete.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validate required checklist items
    if (workOrder.checklistResults && workOrder.checklistResults.length > 0) {
      const pendingRequiredChecklists = workOrder.checklistResults.filter(
        (c) => c.isRequired && !c.completedAt,
      );
      if (pendingRequiredChecklists.length > 0) {
        throw new DomainException(
          'WORK_ORDER_CHECKLIST_INCOMPLETE',
          `Cannot complete work order: ${pendingRequiredChecklists.length} required checklist item(s) are not submitted.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const now = new Date();
    await this.workOrderRepo.update(id, {
      actualEndAt: now,
      completionSummary,
      resolutionCode: resolutionCode ?? null,
      currentState: 'SUPERVISOR_REVIEW',
      version: (workOrder.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_WORK_COMPLETED, {
        workOrderId: id,
        completionSummary,
        resolutionCode,
        actorId: actor?.id,
        organizationId: workOrder.organizationId,
        communityId: workOrder.communityId,
      }),
    );

    return (await this.workOrderRepo.findById(id))!;
  }

  async supervisorReview(
    id: string,
    decision: 'APPROVED' | 'REWORK_REQUESTED',
    reviewNotes?: string | null,
    actor?: Actor,
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);
    const now = new Date();

    const attemptNumber = (workOrder.completionAttempts?.length ?? 0) + 1;
    await this.workOrderRepo.recordCompletionAttempt({
      workOrderId: id,
      attemptNumber,
      submittedById:
        workOrder.primaryAssigneeId || actor?.id || '00000000-0000-0000-0000-000000000000',
      summary: workOrder.completionSummary || 'Work completion submitted',
      reviewOutcome: decision,
      reviewerId: actor?.id ?? null,
      reviewedAt: now,
      reviewNotes: reviewNotes ?? null,
    });

    if (decision === 'APPROVED') {
      await this.workOrderRepo.update(id, {
        currentState: 'COMPLETED',
        verifiedById: actor?.id ?? null,
        verifiedAt: now,
        version: (workOrder.version || 1) + 1,
      });

      // Complete SLA if active
      if (workOrder.slaInstanceId) {
        try {
          await this.slaService.completeSla(workOrder.slaInstanceId);
        } catch (err) {
          this.logger.warn(`Error completing SLA ${workOrder.slaInstanceId}: ${err}`);
        }
      }

      this.eventsService.publish(
        createEvent(DOMAIN_EVENTS.WORK_ORDER_COMPLETED, {
          workOrderId: id,
          verifiedById: actor?.id,
          organizationId: workOrder.organizationId,
          communityId: workOrder.communityId,
        }),
      );
    } else {
      await this.workOrderRepo.update(id, {
        currentState: 'REWORK_REQUIRED',
        reworkCount: (workOrder.reworkCount || 0) + 1,
        version: (workOrder.version || 1) + 1,
      });

      this.eventsService.publish(
        createEvent(DOMAIN_EVENTS.WORK_ORDER_REWORK_REQUESTED, {
          workOrderId: id,
          reviewNotes,
          reviewerId: actor?.id,
          organizationId: workOrder.organizationId,
          communityId: workOrder.communityId,
        }),
      );
    }

    return (await this.workOrderRepo.findById(id))!;
  }

  async cancelWorkOrder(
    id: string,
    reason: string,
    actor?: Actor,
  ): Promise<WorkOrderWithRelations> {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.currentState === 'COMPLETED') {
      throw new DomainException(
        'WORK_ORDER_CANCEL_NOT_ALLOWED',
        'Cannot cancel a completed work order.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.workOrderRepo.update(id, {
      currentState: 'CANCELLED',
      cancelledById: actor?.id ?? null,
      cancelledAt: new Date(),
      cancellationReason: reason,
      version: (workOrder.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.WORK_ORDER_CANCELLED, {
        workOrderId: id,
        reason,
        cancelledById: actor?.id,
        organizationId: workOrder.organizationId,
        communityId: workOrder.communityId,
      }),
    );

    return (await this.workOrderRepo.findById(id))!;
  }

  // ---------------------------------------------------------------------------
  // Tasks Management
  // ---------------------------------------------------------------------------

  async addTask(
    id: string,
    input: {
      title: string;
      description?: string | null;
      sequence?: number;
      isRequired?: boolean;
      assignedUserId?: string | null;
    },
  ): Promise<unknown> {
    await this.getWorkOrderById(id);
    return this.workOrderRepo.addTask({
      workOrderId: id,
      ...input,
    });
  }

  async updateTask(
    id: string,
    taskId: string,
    input: Partial<{
      title: string;
      description: string | null;
      sequence: number;
      isRequired: boolean;
      status: WorkOrderTaskStatus;
      assignedUserId: string | null;
      resultNotes: string | null;
    }>,
    actor?: Actor,
  ): Promise<unknown> {
    await this.getWorkOrderById(id);
    const isCompleted = input.status === 'COMPLETED';
    return this.workOrderRepo.updateTask(taskId, {
      ...input,
      ...(isCompleted ? { completedById: actor?.id ?? null, completedAt: new Date() } : {}),
    });
  }

  // ---------------------------------------------------------------------------
  // Checklists Management
  // ---------------------------------------------------------------------------

  async submitChecklistResult(
    id: string,
    input: {
      itemId: string;
      itemLabel: string;
      itemType: ChecklistItemType;
      isRequired?: boolean;
      valueBoolean?: boolean | null;
      valueText?: string | null;
      valueNumber?: number | null;
      valueDecimal?: unknown;
      valueDate?: string | null;
      valueSelect?: string | null;
      documentId?: string | null;
      isPassed?: boolean | null;
      failureComment?: string | null;
    },
    actor?: Actor,
  ): Promise<unknown> {
    await this.getWorkOrderById(id);
    return this.workOrderRepo.upsertChecklistResult({
      workOrderId: id,
      ...input,
      valueDate: input.valueDate ? new Date(input.valueDate) : null,
      completedById: actor?.id ?? null,
      completedAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // Work Logs & Timers
  // ---------------------------------------------------------------------------

  async startTimer(
    id: string,
    type: WorkLogType = 'WORK',
    notes?: string | null,
    actor?: Actor,
  ): Promise<unknown> {
    if (!actor) {
      throw new DomainException(
        'ACTOR_REQUIRED',
        'Authentication required to start timer',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.getWorkOrderById(id);

    const activeTimer = await this.workOrderRepo.findActiveWorkLog(actor.id);
    if (activeTimer) {
      throw new DomainException(
        'WORK_ORDER_ACTIVE_TIMER_EXISTS',
        `User already has an active timer on work order ${(activeTimer as any).workOrderId}. Please stop it first.`,
        HttpStatus.CONFLICT,
      );
    }

    return this.workOrderRepo.createWorkLog({
      workOrderId: id,
      userId: actor.id,
      type,
      startedAt: new Date(),
      notes: notes ?? null,
      isManual: false,
    });
  }

  async stopTimer(id: string, notes?: string | null, actor?: Actor): Promise<unknown> {
    if (!actor) {
      throw new DomainException(
        'ACTOR_REQUIRED',
        'Authentication required to stop timer',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.getWorkOrderById(id);

    const activeTimer = await this.workOrderRepo.findActiveWorkLog(actor.id);
    if (!activeTimer || (activeTimer as any).workOrderId !== id) {
      throw new DomainException(
        'WORK_ORDER_TIMER_NOT_ACTIVE',
        'No active timer found on this work order for the current user.',
        HttpStatus.NOT_FOUND,
      );
    }

    const now = new Date();
    const durationMinutes = Math.max(
      1,
      Math.round((now.getTime() - new Date((activeTimer as any).startedAt).getTime()) / 60000),
    );

    return this.workOrderRepo.stopWorkLog((activeTimer as any).id, now, durationMinutes, notes);
  }

  async addManualWorkLog(
    id: string,
    input: {
      type?: WorkLogType;
      startedAt: string;
      endedAt: string;
      notes?: string | null;
    },
    actor?: Actor,
  ): Promise<unknown> {
    if (!actor) {
      throw new DomainException(
        'ACTOR_REQUIRED',
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.getWorkOrderById(id);

    const start = new Date(input.startedAt);
    const end = new Date(input.endedAt);
    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

    return this.workOrderRepo.createWorkLog({
      workOrderId: id,
      userId: actor.id,
      type: input.type ?? 'WORK',
      startedAt: start,
      endedAt: end,
      durationMinutes,
      notes: input.notes ?? null,
      isManual: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Evidence & Attachments
  // ---------------------------------------------------------------------------

  async attachEvidence(
    id: string,
    documentId: string,
    evidenceType: WorkEvidenceType = 'WORK_ORDER_ATTACHMENT',
    caption?: string | null,
    actor?: Actor,
  ): Promise<unknown> {
    await this.getWorkOrderById(id);
    return this.workOrderRepo.attachEvidence({
      workOrderId: id,
      documentId,
      evidenceType,
      caption: caption ?? null,
      uploadedById: actor?.id ?? null,
    });
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  async getKpiMetrics(
    organizationId: string,
    communityId?: string | null,
  ): Promise<FacilityKpiMetrics> {
    return this.workOrderRepo.getKpiMetrics(organizationId, communityId) as any;
  }
}
