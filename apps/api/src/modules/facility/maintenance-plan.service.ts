import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import {
  MaintenancePlanRepository,
  MaintenancePlanWithRelations,
} from './maintenance-plan.repository.js';
import { WorkOrderService } from './work-order.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  Actor,
  MaintenancePlanStatus,
  MaintenanceScheduleType,
  MaintenanceMissedPolicy,
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderLocationType,
  MaintenancePlanFilterParams,
} from '@community-os/types';

export interface CreateMaintenancePlanInput {
  organizationId: string;
  communityId: string;
  name: string;
  code: string;
  description?: string | null;
  status?: MaintenancePlanStatus;
  workCategoryId?: string | null;
  workType?: WorkOrderType;
  scheduleType?: MaintenanceScheduleType;
  scheduleDefinition: {
    dayOfWeek?: number;
    dayOfMonth?: number;
    monthOfYear?: number;
    timeOfDay?: string;
    rrule?: string;
    interval?: number;
  };
  timezone?: string;
  businessCalendarId?: string | null;
  defaultPriority?: WorkOrderPriority;
  defaultTeamId?: string | null;
  workflowDefinitionId?: string | null;
  checklistTemplateId?: string | null;
  estimatedDurationMinutes?: number | null;
  generationPolicy?: MaintenanceMissedPolicy;
  leadTimeDays?: number;
  targetLocationType?: WorkOrderLocationType;
  targetSectionId?: string | null;
  targetBuildingId?: string | null;
  targetFloorId?: string | null;
  targetUnitId?: string | null;
  targetLocationDescription?: string | null;
}

export interface UpdateMaintenancePlanInput {
  name?: string;
  description?: string | null;
  status?: MaintenancePlanStatus;
  workCategoryId?: string | null;
  workType?: WorkOrderType;
  scheduleType?: MaintenanceScheduleType;
  scheduleDefinition?: Record<string, unknown>;
  timezone?: string;
  businessCalendarId?: string | null;
  defaultPriority?: WorkOrderPriority;
  defaultTeamId?: string | null;
  workflowDefinitionId?: string | null;
  checklistTemplateId?: string | null;
  estimatedDurationMinutes?: number | null;
  generationPolicy?: MaintenanceMissedPolicy;
  leadTimeDays?: number;
  targetLocationType?: WorkOrderLocationType;
  targetSectionId?: string | null;
  targetBuildingId?: string | null;
  targetFloorId?: string | null;
  targetUnitId?: string | null;
  targetLocationDescription?: string | null;
}

@Injectable()
export class MaintenancePlanService {
  private readonly logger = new Logger(MaintenancePlanService.name);

  constructor(
    private readonly planRepo: MaintenancePlanRepository,
    private readonly workOrderService: WorkOrderService,
    private readonly eventsService: EventsService,
  ) {}

  async createPlan(
    input: CreateMaintenancePlanInput,
    actor?: Actor,
  ): Promise<MaintenancePlanWithRelations> {
    const existing = await this.planRepo.findByCode(
      input.organizationId,
      input.communityId,
      input.code,
    );
    if (existing) {
      throw new DomainException(
        'MAINTENANCE_PLAN_EXISTS',
        `Maintenance plan with code "${input.code}" already exists in this community.`,
        HttpStatus.CONFLICT,
      );
    }

    const nextRunAt = this.calculateNextOccurrence(
      input.scheduleType ?? 'MONTHLY',
      input.scheduleDefinition,
      new Date(),
      input.timezone ?? 'UTC',
    );

    const plan = await this.planRepo.create({
      ...input,
      nextRunAt: input.status === 'ACTIVE' ? nextRunAt : null,
      createdById: actor?.id ?? null,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.MAINTENANCE_PLAN_CREATED, {
        planId: plan.id,
        code: plan.code,
        name: plan.name,
        organizationId: plan.organizationId,
        communityId: plan.communityId,
        actorId: actor?.id,
      }),
    );

    return plan;
  }

  async getPlanById(id: string): Promise<MaintenancePlanWithRelations> {
    const plan = await this.planRepo.findById(id);
    if (!plan) {
      throw new DomainException(
        'MAINTENANCE_PLAN_NOT_FOUND',
        `Maintenance plan with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return plan;
  }

  async listPlans(filters: MaintenancePlanFilterParams): Promise<{
    items: MaintenancePlanWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.planRepo.findMany(filters);
  }

  async updatePlan(
    id: string,
    input: UpdateMaintenancePlanInput,
    _actor?: Actor,
  ): Promise<MaintenancePlanWithRelations> {
    const existing = await this.getPlanById(id);

    let nextRunAt: Date | null = existing.nextRunAt ? new Date(existing.nextRunAt) : null;
    if (input.scheduleDefinition || input.scheduleType || input.timezone || input.status) {
      const scheduleType = input.scheduleType || existing.scheduleType;
      const scheduleDef = input.scheduleDefinition || existing.scheduleDefinition;
      const tz = input.timezone || existing.timezone;
      const status = input.status || existing.status;

      if (status === 'ACTIVE') {
        nextRunAt = this.calculateNextOccurrence(scheduleType, scheduleDef, new Date(), tz);
      } else {
        nextRunAt = null;
      }
    }

    return this.planRepo.update(id, {
      ...input,
      scheduleDefinition: (input.scheduleDefinition as any) ?? undefined,
      nextRunAt,
      version: (existing.version || 1) + 1,
    } as any);
  }

  async activatePlan(id: string, actor?: Actor): Promise<MaintenancePlanWithRelations> {
    const existing = await this.getPlanById(id);
    const nextRunAt = this.calculateNextOccurrence(
      existing.scheduleType,
      existing.scheduleDefinition,
      new Date(),
      existing.timezone,
    );

    const updated = await this.planRepo.update(id, {
      status: 'ACTIVE',
      nextRunAt,
      version: (existing.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.MAINTENANCE_PLAN_ACTIVATED, {
        planId: id,
        nextRunAt: nextRunAt?.toISOString(),
        organizationId: existing.organizationId,
        communityId: existing.communityId,
        actorId: actor?.id,
      }),
    );

    return updated;
  }

  async pausePlan(id: string, actor?: Actor): Promise<MaintenancePlanWithRelations> {
    const existing = await this.getPlanById(id);
    const updated = await this.planRepo.update(id, {
      status: 'PAUSED',
      nextRunAt: null,
      version: (existing.version || 1) + 1,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.MAINTENANCE_PLAN_PAUSED, {
        planId: id,
        organizationId: existing.organizationId,
        communityId: existing.communityId,
        actorId: actor?.id,
      }),
    );

    return updated;
  }

  async archivePlan(id: string, _actor?: Actor): Promise<MaintenancePlanWithRelations> {
    const existing = await this.getPlanById(id);
    return this.planRepo.update(id, {
      status: 'ARCHIVED',
      nextRunAt: null,
      version: (existing.version || 1) + 1,
    });
  }

  previewNextOccurrences(
    scheduleType: MaintenanceScheduleType,
    scheduleDefinition: Record<string, unknown>,
    count = 10,
    timezone = 'UTC',
  ): string[] {
    const occurrences: string[] = [];
    let fromDate = new Date();

    for (let i = 0; i < count; i++) {
      const next = this.calculateNextOccurrence(
        scheduleType,
        scheduleDefinition,
        fromDate,
        timezone,
      );
      if (!next) break;
      occurrences.push(next.toISOString());
      fromDate = new Date(next.getTime() + 60000);
    }

    return occurrences;
  }

  async generateOccurrence(
    planId: string,
    occurrenceDate: Date,
    isManual = false,
    actor?: Actor,
  ): Promise<unknown> {
    const plan = await this.getPlanById(planId);
    if (plan.status !== 'ACTIVE' && !isManual) {
      throw new DomainException(
        'MAINTENANCE_PLAN_INACTIVE',
        `Cannot generate work orders for inactive plan ${plan.code}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const occurrenceKey = `${plan.id}:${occurrenceDate.toISOString()}`;
    const existingOccurrence = await this.planRepo.findOccurrence(plan.id, occurrenceKey);

    if (existingOccurrence && (existingOccurrence as any).workOrderId) {
      this.logger.log(`Occurrence ${occurrenceKey} already generated. Skipping.`);
      return existingOccurrence;
    }

    // Create Work Order
    const workOrder = await this.workOrderService.createWorkOrder(
      {
        organizationId: plan.organizationId,
        communityId: plan.communityId,
        title: `[${plan.code}] ${plan.name}`,
        description: plan.description || `Scheduled recurring maintenance for ${plan.name}`,
        workType: plan.workType || 'PREVENTIVE',
        priority: plan.defaultPriority || 'NORMAL',
        categoryId: plan.workCategoryId,
        locationType: plan.targetLocationType || 'COMMUNITY',
        propertySectionId: plan.targetSectionId,
        buildingId: plan.targetBuildingId,
        floorId: plan.targetFloorId,
        unitId: plan.targetUnitId,
        locationDescription: plan.targetLocationDescription,
        source: 'PREVENTIVE_PLAN',
        maintenancePlanId: plan.id,
        planVersion: plan.version,
        scheduledOccurrenceAt: occurrenceDate.toISOString(),
        scheduledStartAt: occurrenceDate.toISOString(),
        dueAt: new Date(occurrenceDate.getTime() + 86400000 * 2).toISOString(),
        primaryTeamId: plan.defaultTeamId,
        checklistTemplateId: plan.checklistTemplateId,
      },
      actor,
    );

    // Record Occurrence
    let occurrence = existingOccurrence;
    if (!occurrence) {
      occurrence = await this.planRepo.recordOccurrence({
        maintenancePlanId: plan.id,
        occurrenceKey,
        scheduledAt: occurrenceDate,
        workOrderId: workOrder.id,
        status: 'GENERATED',
      });
    }

    // Advance Next Run At
    const nextRun = this.calculateNextOccurrence(
      plan.scheduleType,
      plan.scheduleDefinition,
      new Date(occurrenceDate.getTime() + 60000),
      plan.timezone,
    );

    await this.planRepo.update(plan.id, {
      lastRunAt: new Date(),
      nextRunAt: nextRun,
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.MAINTENANCE_PLAN_WORK_ORDER_GENERATED, {
        planId: plan.id,
        workOrderId: workOrder.id,
        occurrenceKey,
        scheduledAt: occurrenceDate.toISOString(),
        organizationId: plan.organizationId,
        communityId: plan.communityId,
      }),
    );

    return { occurrence, workOrder };
  }

  // ---------------------------------------------------------------------------
  // Recurrence Schedule Calculation
  // ---------------------------------------------------------------------------

  calculateNextOccurrence(
    scheduleType: MaintenanceScheduleType,
    def: {
      dayOfWeek?: number;
      dayOfMonth?: number;
      monthOfYear?: number;
      timeOfDay?: string;
      interval?: number;
    } = {},
    fromDate: Date = new Date(),
    _timezone = 'UTC',
  ): Date | null {
    const next = new Date(fromDate.getTime());
    const [hours, minutes] = (def.timeOfDay || '09:00').split(':').map(Number);
    next.setUTCMinutes(minutes || 0, 0, 0);
    next.setUTCHours(hours || 9);

    const interval = def.interval || 1;

    switch (scheduleType) {
      case 'DAILY': {
        if (next <= fromDate) {
          next.setUTCDate(next.getUTCDate() + interval);
        }
        return next;
      }
      case 'WEEKLY': {
        const targetDay = def.dayOfWeek !== undefined ? def.dayOfWeek : 1;
        let diff = (targetDay - next.getUTCDay() + 7) % 7;
        if (diff === 0 && next <= fromDate) {
          diff = 7 * interval;
        }
        next.setUTCDate(next.getUTCDate() + diff);
        return next;
      }
      case 'MONTHLY': {
        const targetDay = def.dayOfMonth !== undefined ? def.dayOfMonth : 1;
        next.setUTCDate(targetDay);
        if (next <= fromDate) {
          next.setUTCMonth(next.getUTCMonth() + interval);
          next.setUTCDate(targetDay);
        }
        return next;
      }
      case 'QUARTERLY': {
        const targetDay = def.dayOfMonth !== undefined ? def.dayOfMonth : 1;
        next.setUTCDate(targetDay);
        if (next <= fromDate) {
          next.setUTCMonth(next.getUTCMonth() + 3);
          next.setUTCDate(targetDay);
        }
        return next;
      }
      case 'YEARLY': {
        const targetMonth = def.monthOfYear !== undefined ? def.monthOfYear - 1 : 0;
        const targetDay = def.dayOfMonth !== undefined ? def.dayOfMonth : 1;
        next.setUTCMonth(targetMonth, targetDay);
        if (next <= fromDate) {
          next.setUTCFullYear(next.getUTCFullYear() + interval);
          next.setUTCMonth(targetMonth, targetDay);
        }
        return next;
      }
      default:
        return new Date(fromDate.getTime() + 86400000);
    }
  }
}
