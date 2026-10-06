import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { TicketRepository, type TicketRecordWithRelations } from './ticket.repository.js';
import { TicketSequenceService } from './ticket-sequence.service.js';
import { TicketCategoryRepository } from './ticket-category.repository.js';
import { HelpdeskTeamRepository } from './helpdesk-team.repository.js';
import { WorkflowService } from '../workflow/workflow.service.js';
import { SlaService } from '../sla/sla.service.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { CustomFieldService } from '../custom-field/custom-field.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type {
  Ticket,
  TicketComment,
  TicketFeedback,
  TicketRelation,
  TicketTimelineItem,
  HelpdeskKpiMetrics,
  Actor,
  TicketCommentType,
} from '@community-os/types';
import type {
  CreateTicketInput,
  CreateResidentTicketInput,
  AssignTicketInput,
  ChangeTicketPriorityInput,
  TransitionTicketInput,
  ResolveTicketInput,
  CloseTicketInput,
  ReopenTicketInput,
  CancelTicketInput,
  CreateTicketCommentInput,
  CreateTicketFeedbackInput,
  LinkTicketRelationInput,
  SlaOverrideTicketInput,
  TicketFilterInput,
} from '@community-os/validation';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketRepo: TicketRepository,
    private readonly sequenceService: TicketSequenceService,
    private readonly categoryRepo: TicketCategoryRepository,
    private readonly teamRepo: HelpdeskTeamRepository,
    private readonly workflowService: WorkflowService,
    private readonly slaService: SlaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly customFieldService: CustomFieldService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  // ===========================================================================
  // TICKET CREATION (STAFF & RESIDENT PATHS)
  // ===========================================================================

  async createTicket(input: CreateTicketInput, actor: Actor): Promise<Ticket> {
    // 1. Verify Category
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw new DomainException(
        'CATEGORY_NOT_FOUND',
        `Ticket category "${input.categoryId}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Generate Human-Readable Sequential Ticket Number
    const ticketNumber = await this.sequenceService.getNextTicketNumber(
      input.organizationId,
      input.communityId,
    );

    // 3. Determine Initial Priority & Team
    const priority = input.priority || category.defaultPriority || 'NORMAL';
    const assignedTeamId = input.assignedTeamId || category.defaultTeamId || null;

    // 4. Start Workflow Instance via Phase 7 Workflow Engine
    const workflowKey = 'workflow.ticket.standard';
    const workflowInstance = await this.workflowService.startInstance({
      workflowDefinitionKey: workflowKey,
      resourceType: 'TICKET',
      resourceId: '00000000-0000-0000-0000-000000000000',
      organizationId: input.organizationId,
      communityId: input.communityId,
      contextSnapshot: {
        ticketNumber,
        title: input.title,
        priority,
        categoryId: category.id,
        categoryKey: category.key,
        assignedTeamId,
      },
      actor,
    });

    // 5. Start SLA Instance if Category has SLA Policy attached
    let slaInstanceId: string | null = null;
    let slaDueAt: Date | null = null;
    let slaWarningAt: Date | null = null;

    if (category.defaultSlaPolicyId) {
      try {
        const slaPolicy = await this.prisma.slaPolicyDefinition.findUnique({
          where: { id: category.defaultSlaPolicyId },
        });
        if (slaPolicy) {
          const slaInst = await this.slaService.startSla({
            policyKey: slaPolicy.key,
            policyVersion: slaPolicy.version,
            resourceType: 'TICKET',
            resourceId: workflowInstance.id,
            workflowInstanceId: workflowInstance.id,
            organizationId: input.organizationId,
            communityId: input.communityId,
          });
          slaInstanceId = slaInst.id;
          slaDueAt = slaInst.dueAt ?? null;
          slaWarningAt = slaInst.warningAt ?? null;
        }
      } catch (err) {
        this.logger.warn(
          `Could not start SLA for category ${category.id}: ${String(err)}`,
          'TicketService',
        );
      }
    }

    // 6. Create Ticket in Database
    const ticket = await this.ticketRepo.createTicket({
      organizationId: input.organizationId,
      communityId: input.communityId,
      ticketNumber,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId ?? null,
      priority,
      currentState: workflowInstance.currentState || 'NEW',
      source: input.source || 'ADMIN_WEB',
      locationType: input.locationType || 'UNIT',
      propertySectionId: input.propertySectionId ?? null,
      buildingId: input.buildingId ?? null,
      floorId: input.floorId ?? null,
      unitId: input.unitId ?? null,
      locationDescription: input.locationDescription ?? null,
      reportedByResidentId: input.reportedByResidentId ?? null,
      reportedByUserId: actor.id,
      assignedTeamId,
      assignedUserId: input.assignedUserId ?? null,
      workflowInstanceId: workflowInstance.id,
      slaInstanceId,
      slaStatus: slaInstanceId ? 'ACTIVE' : null,
      slaDueAt,
      slaWarningAt,
    });

    // 7. Re-link Workflow resourceId to actual Ticket ID
    await this.prisma.workflowInstance.update({
      where: { id: workflowInstance.id },
      data: { resourceId: ticket.id },
    });

    // 8. Record Assignment History if initially assigned
    if (assignedTeamId || input.assignedUserId) {
      await this.ticketRepo.createAssignmentHistory({
        ticketId: ticket.id,
        toTeamId: assignedTeamId,
        toUserId: input.assignedUserId ?? null,
        assignedById: actor.id,
        reason: 'Initial assignment upon ticket creation',
      });
    }

    // 9. Save Custom Fields if provided
    if (input.customFieldValues && Object.keys(input.customFieldValues).length > 0) {
      try {
        const defs = await this.customFieldService.getDefinitions({
          organizationId: ticket.organizationId,
          communityId: ticket.communityId,
          entityType: 'TICKET',
        });
        const valuesList = Object.entries(input.customFieldValues)
          .map(([key, value]) => {
            const def = defs.find((d) => d.key === key);
            return def ? { definitionId: def.id, value } : null;
          })
          .filter((v): v is { definitionId: string; value: unknown } => Boolean(v));

        if (valuesList.length > 0) {
          await this.customFieldService.setEntityValues(
            'TICKET',
            ticket.id,
            { values: valuesList },
            {
              userId: actor.id,
              organizationId: ticket.organizationId,
              communityId: ticket.communityId,
            },
          );
        }
      } catch (err) {
        this.logger.warn(
          `Could not save custom fields for ticket ${ticket.id}: ${String(err)}`,
          'TicketService',
        );
      }
    }

    // 10. Record Immutable Audit Event
    await this.auditService.record({
      organizationId: ticket.organizationId,
      communityId: ticket.communityId,
      actorType: actor.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor.id,
      sessionId: actor.sessionId,
      action: 'TICKET_CREATED',
      resourceType: 'TICKET',
      resourceId: ticket.id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        priority: ticket.priority,
        category: category.name,
      },
    });

    // 11. Emit Domain Event
    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_CREATED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        organizationId: ticket.organizationId,
        communityId: ticket.communityId,
        title: ticket.title,
        categoryId: ticket.categoryId,
        priority: ticket.priority,
        reportedByResidentId: ticket.reportedByResidentId,
        reportedByUserId: ticket.reportedByUserId,
        assignedTeamId: ticket.assignedTeamId,
        assignedUserId: ticket.assignedUserId,
      }),
    );

    return ticket;
  }

  async createResidentTicket(input: CreateResidentTicketInput, actor: Actor): Promise<Ticket> {
    const resident = await this.prisma.resident.findFirst({
      where: { userId: actor.id },
      include: {
        householdMembers: {
          include: {
            household: { select: { unitId: true, communityId: true, organizationId: true } },
          },
        },
        ownerships: { select: { unitId: true, communityId: true, organizationId: true } },
      },
    });

    const community = await this.prisma.community.findUnique({
      where: { id: input.communityId },
    });

    const orgId = resident?.organizationId || community?.organizationId;
    if (!orgId) {
      throw new DomainException(
        'ORGANIZATION_CONTEXT_REQUIRED',
        'Cannot resolve organization context for ticket creation.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let unitId = input.unitId ?? null;
    let buildingId: string | null = null;
    let floorId: string | null = null;
    let propertySectionId: string | null = null;

    if (unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: unitId },
      });
      if (unit) {
        buildingId = unit.buildingId;
        floorId = unit.floorId;
        propertySectionId = unit.sectionId;
      }
    } else if (resident) {
      const firstHouseholdUnit = resident.householdMembers[0]?.household?.unitId;
      const firstOwnedUnit = resident.ownerships[0]?.unitId;
      unitId = firstHouseholdUnit || firstOwnedUnit || null;
      if (unitId) {
        const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
        if (unit) {
          buildingId = unit.buildingId;
          floorId = unit.floorId;
          propertySectionId = unit.sectionId;
        }
      }
    }

    return this.createTicket(
      {
        organizationId: orgId,
        communityId: input.communityId,
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        priority: input.priority || 'NORMAL',
        source: 'RESIDENT_APP',
        locationType: input.locationType || 'UNIT',
        unitId,
        buildingId,
        floorId,
        propertySectionId,
        locationDescription: input.locationDescription,
        reportedByResidentId: resident?.id || null,
        customFieldValues: input.customFieldValues,
      },
      actor,
    );
  }

  // ===========================================================================
  // TICKET RETRIEVAL & QUERYING
  // ===========================================================================

  async getTicketById(
    id: string,
    actor: Actor,
  ): Promise<
    TicketRecordWithRelations & {
      allowedActions?: Array<{ action: string; label: string; toState: string }>;
    }
  > {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const isResident = await this.isResidentUser(actor.id);
    if (isResident && !actor.isPlatformAdmin) {
      await this.verifyResidentAccess(ticket, actor);
    }

    let allowedActions: Array<{ action: string; label: string; toState: string }> = [];
    if (ticket.workflowInstanceId) {
      try {
        const actions = await this.workflowService.getAllowedActions(
          ticket.workflowInstanceId,
          actor,
        );
        allowedActions = actions.map((a) => ({
          action: a.action,
          label: a.label,
          toState: a.targetState,
        }));
      } catch (err) {
        this.logger.debug(
          `Could not fetch allowed workflow actions: ${String(err)}`,
          'TicketService',
        );
      }
    }

    return {
      ...ticket,
      allowedActions,
    };
  }

  async listTickets(
    filters: TicketFilterInput,
    actor: Actor,
  ): Promise<{ items: TicketRecordWithRelations[]; total: number }> {
    const queryFilters: TicketFilterInput & {
      assignedTeamIds?: string[];
      residentUnitIds?: string[];
      currentUserId?: string;
    } = { ...filters };

    const isResident = await this.isResidentUser(actor.id);
    if (isResident && !actor.isPlatformAdmin) {
      const authorizedUnits = await this.getResidentUnitIds(actor.id);
      queryFilters.residentUnitIds = authorizedUnits;
      queryFilters.currentUserId = actor.id;
    }

    return this.ticketRepo.findManyTickets(queryFilters);
  }

  // ===========================================================================
  // TICKET ASSIGNMENT & CLAIM
  // ===========================================================================

  async assignTicket(id: string, input: AssignTicketInput, actor: Actor): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const previousTeamId = ticket.assignedTeamId;
    const previousUserId = ticket.assignedUserId;

    await this.ticketRepo.createAssignmentHistory({
      ticketId: ticket.id,
      fromTeamId: previousTeamId,
      toTeamId: input.teamId ?? previousTeamId,
      fromUserId: previousUserId,
      toUserId: input.userId ?? null,
      assignedById: actor.id,
      reason: input.reason ?? 'Reassigned by management',
    });

    const updated = await this.ticketRepo.updateTicket(id, {
      assignedTeamId: input.teamId !== undefined ? input.teamId : previousTeamId,
      assignedUserId: input.userId !== undefined ? input.userId : previousUserId,
    });

    if (ticket.currentState === 'NEW' || ticket.currentState === 'TRIAGED') {
      try {
        await this.workflowService.transition({
          instanceId: ticket.workflowInstanceId,
          action: 'assign',
          reason: input.reason || 'Ticket assigned to technician/team',
          actor,
        });
        await this.ticketRepo.updateTicket(id, { currentState: 'ASSIGNED' });
      } catch (err) {
        this.logger.debug(
          `Assign transition skipped or not applicable: ${String(err)}`,
          'TicketService',
        );
      }
    }

    await this.auditService.record({
      organizationId: ticket.organizationId,
      communityId: ticket.communityId,
      actorType: actor.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor.id,
      sessionId: actor.sessionId,
      action: 'TICKET_ASSIGNED',
      resourceType: 'TICKET',
      resourceId: ticket.id,
      metadata: {
        toTeamId: input.teamId,
        toUserId: input.userId,
        reason: input.reason,
      },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_ASSIGNED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        organizationId: ticket.organizationId,
        communityId: ticket.communityId,
        assignedTeamId: input.teamId,
        assignedUserId: input.userId,
        assignedById: actor.id,
        reason: input.reason,
      }),
    );

    return updated;
  }

  async claimTicket(id: string, actor: Actor): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (ticket.assignedUserId && ticket.assignedUserId !== actor.id) {
      throw new DomainException(
        'TICKET_ALREADY_ASSIGNED',
        'This ticket has already been assigned to another technician.',
        HttpStatus.CONFLICT,
      );
    }

    return this.assignTicket(
      id,
      {
        teamId: ticket.assignedTeamId,
        userId: actor.id,
        reason: 'Self-claimed by technician from queue',
      },
      actor,
    );
  }

  async changePriority(
    id: string,
    input: ChangeTicketPriorityInput,
    actor: Actor,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const previousPriority = ticket.priority;
    const updated = await this.ticketRepo.updateTicket(id, {
      priority: input.priority,
    });

    await this.auditService.record({
      organizationId: ticket.organizationId,
      communityId: ticket.communityId,
      actorType: actor.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor.id,
      sessionId: actor.sessionId,
      action: 'TICKET_PRIORITY_CHANGED',
      resourceType: 'TICKET',
      resourceId: ticket.id,
      metadata: {
        fromPriority: previousPriority,
        toPriority: input.priority,
        reason: input.reason,
      },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_PRIORITY_CHANGED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        priority: input.priority,
        actorId: actor.id,
        reason: input.reason,
      }),
    );

    return updated;
  }

  // ===========================================================================
  // WORKFLOW TRANSITIONS & LIFECYCLE
  // ===========================================================================

  async transitionTicket(id: string, input: TransitionTicketInput, actor: Actor): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const instance = await this.workflowService.transition({
      instanceId: ticket.workflowInstanceId,
      action: input.action,
      reason: input.reason,
      comment: input.comment,
      actor,
    });

    const updated = await this.ticketRepo.updateTicket(id, {
      currentState: instance.currentState,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_TRANSITIONED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        fromState: ticket.currentState,
        toState: instance.currentState,
        action: input.action,
        actorId: actor.id,
        reason: input.reason,
      }),
    );

    return updated;
  }

  async resolveTicket(id: string, input: ResolveTicketInput, actor: Actor): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const instance = await this.workflowService.transition({
      instanceId: ticket.workflowInstanceId,
      action: 'resolve',
      reason: input.resolutionSummary,
      actor,
    });

    const resolvedAt = new Date();
    const updated = await this.ticketRepo.updateTicket(id, {
      currentState: instance.currentState || 'RESOLVED',
      resolutionCode: input.resolutionCode,
      resolutionSummary: input.resolutionSummary,
      resolvedById: actor.id,
      resolvedAt,
      slaStatus: ticket.slaInstanceId ? 'COMPLETED' : null,
    });

    if (ticket.slaInstanceId) {
      try {
        await this.slaService.completeSla(ticket.slaInstanceId);
      } catch (err) {
        this.logger.debug(`Could not mark SLA completed: ${String(err)}`, 'TicketService');
      }
    }

    await this.auditService.record({
      organizationId: ticket.organizationId,
      communityId: ticket.communityId,
      actorType: actor.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor.id,
      sessionId: actor.sessionId,
      action: 'TICKET_RESOLVED',
      resourceType: 'TICKET',
      resourceId: ticket.id,
      metadata: {
        resolutionCode: input.resolutionCode,
        resolutionSummary: input.resolutionSummary,
      },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_RESOLVED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        organizationId: ticket.organizationId,
        communityId: ticket.communityId,
        resolutionCode: input.resolutionCode,
        resolutionSummary: input.resolutionSummary,
        resolvedById: actor.id,
        resolvedAt: resolvedAt.toISOString(),
      }),
    );

    return updated;
  }

  async closeTicket(id: string, input: CloseTicketInput, actor: Actor): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const instance = await this.workflowService.transition({
      instanceId: ticket.workflowInstanceId,
      action: 'close',
      reason: input.reason || 'Ticket verified and closed',
      actor,
    });

    const closedAt = new Date();
    const updated = await this.ticketRepo.updateTicket(id, {
      currentState: instance.currentState || 'CLOSED',
      closedAt,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_CLOSED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        closedById: actor.id,
        closedAt: closedAt.toISOString(),
      }),
    );

    return updated;
  }

  async reopenTicket(id: string, input: ReopenTicketInput, actor: Actor): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (ticket.currentState !== 'RESOLVED' && ticket.currentState !== 'CLOSED') {
      throw new DomainException(
        'INVALID_TICKET_STATE',
        'Only resolved or closed tickets can be reopened.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const instance = await this.workflowService.transition({
      instanceId: ticket.workflowInstanceId,
      action: 'reopen',
      reason: input.reason,
      actor,
    });

    const reopenedAt = new Date();
    const newReopenCount = (ticket.reopenCount || 0) + 1;

    const updated = await this.ticketRepo.updateTicket(id, {
      currentState: instance.currentState || 'REOPENED',
      reopenCount: newReopenCount,
      reopenedAt,
    });

    await this.ticketRepo.createComment({
      ticketId: ticket.id,
      authorUserId: actor.id,
      type: 'PUBLIC_REPLY',
      body: `Ticket reopened: ${input.reason}`,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_REOPENED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        reopenedById: actor.id,
        reopenCount: newReopenCount,
        reason: input.reason,
        reopenedAt: reopenedAt.toISOString(),
      }),
    );

    return updated;
  }

  async cancelTicket(id: string, input: CancelTicketInput, actor: Actor): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const instance = await this.workflowService.transition({
      instanceId: ticket.workflowInstanceId,
      action: 'cancel',
      reason: input.reason,
      actor,
    });

    const cancelledAt = new Date();
    const updated = await this.ticketRepo.updateTicket(id, {
      currentState: instance.currentState || 'CANCELLED',
      cancelledAt,
      cancellationReason: input.reason,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_CANCELLED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        cancelledById: actor.id,
        reason: input.reason,
        cancelledAt: cancelledAt.toISOString(),
      }),
    );

    return updated;
  }

  // ===========================================================================
  // COMMENTS & NOTES (SECURITY: INTERNAL_NOTES FILTERED FOR RESIDENTS)
  // ===========================================================================

  async addComment(
    id: string,
    input: CreateTicketCommentInput,
    actor: Actor,
  ): Promise<TicketComment> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    let commentType: TicketCommentType = input.type;
    const isResident = await this.isResidentUser(actor.id);
    if (isResident && !actor.isPlatformAdmin) {
      commentType = 'PUBLIC_REPLY';
    }

    const resident = await this.prisma.resident.findFirst({ where: { userId: actor.id } });

    const comment = await this.ticketRepo.createComment({
      ticketId: ticket.id,
      authorUserId: actor.id,
      authorResidentId: resident?.id || null,
      type: commentType,
      body: input.body,
    });

    const isInternal = commentType === 'INTERNAL_NOTE';
    const eventName = isInternal
      ? DOMAIN_EVENTS.TICKET_INTERNAL_NOTE_ADDED
      : DOMAIN_EVENTS.TICKET_COMMENT_ADDED;

    this.eventsService.publish(
      createEvent(eventName, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        commentId: comment.id,
        type: commentType,
        authorUserId: actor.id,
        authorResidentId: resident?.id || null,
      }),
    );

    return comment;
  }

  async getComments(
    id: string,
    actor: Actor,
  ): Promise<Array<TicketComment & { authorName?: string }>> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const isResident = await this.isResidentUser(actor.id);
    const includeInternalNotes = !isResident || actor.isPlatformAdmin;
    return this.ticketRepo.findComments(id, includeInternalNotes);
  }

  // ===========================================================================
  // FEEDBACK, RELATIONS & SLA OVERRIDES
  // ===========================================================================

  async submitFeedback(
    id: string,
    input: CreateTicketFeedbackInput,
    actor: Actor,
  ): Promise<TicketFeedback> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (ticket.currentState !== 'RESOLVED' && ticket.currentState !== 'CLOSED') {
      throw new DomainException(
        'INVALID_TICKET_STATE',
        'Feedback can only be submitted for resolved or closed tickets.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const resident = await this.prisma.resident.findFirst({ where: { userId: actor.id } });

    const feedback = await this.ticketRepo.createFeedback({
      ticketId: ticket.id,
      userId: actor.id,
      residentId: resident?.id || null,
      rating: input.rating,
      comment: input.comment ?? null,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.TICKET_FEEDBACK_SUBMITTED, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        userId: actor.id,
        residentId: resident?.id || null,
        rating: input.rating,
        comment: input.comment,
      }),
    );

    return feedback;
  }

  async linkRelation(
    id: string,
    input: LinkTicketRelationInput,
    actor: Actor,
  ): Promise<TicketRelation> {
    const sourceTicket = await this.ticketRepo.findTicketById(id);
    if (!sourceTicket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const targetTicket = await this.ticketRepo.findTicketById(input.targetTicketId);
    if (!targetTicket) {
      throw new DomainException(
        'TARGET_TICKET_NOT_FOUND',
        'Target ticket not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (input.relationType === 'DUPLICATE_OF') {
      await this.ticketRepo.updateTicket(id, {
        duplicateOfTicketId: targetTicket.id,
      });
    }

    return this.ticketRepo.createRelation({
      sourceTicketId: id,
      targetTicketId: input.targetTicketId,
      relationType: input.relationType,
      createdById: actor.id,
    });
  }

  async overrideSla(id: string, input: SlaOverrideTicketInput, actor: Actor): Promise<Ticket> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const newDue = new Date(input.newDueAt);
    const updated = await this.ticketRepo.updateTicket(id, {
      slaDueAt: newDue,
    });

    await this.auditService.record({
      organizationId: ticket.organizationId,
      communityId: ticket.communityId,
      actorType: actor.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor.id,
      sessionId: actor.sessionId,
      action: 'TICKET_SLA_OVERRIDE',
      resourceType: 'TICKET',
      resourceId: ticket.id,
      metadata: {
        newDueAt: input.newDueAt,
        reason: input.reason,
      },
    });

    return updated;
  }

  async getKpiMetrics(organizationId: string, communityId?: string): Promise<HelpdeskKpiMetrics> {
    return this.ticketRepo.getKpiMetrics(organizationId, communityId);
  }

  async getTimeline(id: string, actor: Actor): Promise<TicketTimelineItem[]> {
    const ticket = await this.ticketRepo.findTicketById(id);
    if (!ticket) {
      throw new DomainException(
        'TICKET_NOT_FOUND',
        `Ticket "${id}" not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const isResident = await this.isResidentUser(actor.id);
    const items: TicketTimelineItem[] = [];

    items.push({
      id: `creation-${ticket.id}`,
      type: 'CREATION',
      title: 'Ticket Created',
      description: ticket.description,
      actorId: ticket.reportedByUserId,
      actorName: ticket.reportedByUser?.displayName || ticket.reportedByResident?.displayName,
      occurredAt: ticket.createdAt,
    });

    if (ticket.workflowInstanceId) {
      const transitions = await this.prisma.workflowTransitionHistory.findMany({
        where: { workflowInstanceId: ticket.workflowInstanceId },
        orderBy: { occurredAt: 'asc' },
      });
      for (const t of transitions) {
        items.push({
          id: `workflow-${t.id}`,
          type: 'WORKFLOW_TRANSITION',
          title: `Status changed to ${t.toState}`,
          description: t.reason || t.comment,
          actorId: t.actorId,
          actorType: t.actorType,
          occurredAt: t.occurredAt,
        });
      }
    }

    const assignments = await this.ticketRepo.findAssignmentHistory(ticket.id);
    for (const a of assignments) {
      items.push({
        id: `assign-${a.id}`,
        type: 'ASSIGNMENT',
        title: a.toUserName
          ? `Assigned to ${a.toUserName}`
          : a.toTeamName
            ? `Assigned to team ${a.toTeamName}`
            : 'Assigned',
        description: a.reason,
        actorId: a.assignedById,
        actorName: a.assignedByName,
        occurredAt: a.assignedAt,
      });
    }

    const comments = await this.ticketRepo.findComments(
      ticket.id,
      !isResident || actor.isPlatformAdmin,
    );
    for (const c of comments) {
      items.push({
        id: `comment-${c.id}`,
        type: c.type === 'INTERNAL_NOTE' ? 'INTERNAL_NOTE' : 'COMMENT',
        title: c.type === 'INTERNAL_NOTE' ? 'Internal Staff Note' : 'Public Reply',
        description: c.body,
        actorId: c.authorUserId,
        actorName: c.authorName,
        occurredAt: c.createdAt,
      });
    }

    if (ticket.feedback) {
      items.push({
        id: `feedback-${ticket.feedback.id}`,
        type: 'FEEDBACK',
        title: `Resident Feedback: ${ticket.feedback.rating}/5 Stars`,
        description: ticket.feedback.comment,
        actorId: ticket.feedback.userId,
        occurredAt: ticket.feedback.submittedAt,
      });
    }

    items.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    return items;
  }

  private async isResidentUser(userId: string): Promise<boolean> {
    const resident = await this.prisma.resident.findFirst({ where: { userId } });
    return Boolean(resident);
  }

  private async verifyResidentAccess(
    ticket: TicketRecordWithRelations,
    actor: Actor,
  ): Promise<void> {
    if (ticket.reportedByUserId === actor.id) return;

    const authorizedUnits = await this.getResidentUnitIds(actor.id);
    if (ticket.unitId && authorizedUnits.includes(ticket.unitId)) return;

    throw new DomainException(
      'UNAUTHORIZED_TICKET_ACCESS',
      'You are not authorized to access this ticket.',
      HttpStatus.FORBIDDEN,
    );
  }

  private async getResidentUnitIds(userId: string): Promise<string[]> {
    const resident = await this.prisma.resident.findFirst({
      where: { userId },
      include: {
        householdMembers: {
          include: { household: { select: { unitId: true } } },
        },
        ownerships: { select: { unitId: true } },
      },
    });

    if (!resident) return [];

    const unitIds = new Set<string>();
    for (const m of resident.householdMembers || []) {
      if (m.household?.unitId) unitIds.add(m.household.unitId);
    }
    for (const o of resident.ownerships || []) {
      if (o.unitId) unitIds.add(o.unitId);
    }

    return Array.from(unitIds);
  }
}
