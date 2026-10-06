import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SlaPolicyRepository } from './sla-policy.repository.js';
import { SlaInstanceRepository } from './sla-instance.repository.js';
import { BusinessCalendarRepository } from './business-calendar.repository.js';
import { BusinessCalendarService } from './business-calendar.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS } from '@community-os/events';
import { createEvent } from '@community-os/events';
import type {
  Actor,
  ScopeType,
  SlaPolicyStatus,
  SlaMetricType,
  SlaInstanceStatus,
  BusinessCalendarException,
  SlaPolicyDefinition,
  SlaInstance,
  BusinessCalendar,
} from '@community-os/types';
import type { Prisma } from '@prisma/client';

@Injectable()
export class SlaService {
  constructor(
    private readonly policyRepo: SlaPolicyRepository,
    private readonly instanceRepo: SlaInstanceRepository,
    private readonly calendarRepo: BusinessCalendarRepository,
    private readonly calendarService: BusinessCalendarService,
    private readonly eventBus: EventsService,
  ) {}

  // ===========================================================================
  // SLA POLICY LIFECYCLE
  // ===========================================================================

  async createPolicyDraft(
    data: {
      organizationId?: string | null;
      communityId?: string | null;
      scopeType?: 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY';
      key: string;
      name: string;
      description?: string;
      metricType?:
        | 'TIME_TO_ACKNOWLEDGE'
        | 'TIME_TO_FIRST_ACTION'
        | 'TIME_TO_RESOLUTION'
        | 'TIME_IN_STATE'
        | 'APPROVAL_RESPONSE'
        | 'CUSTOM';
      durationMinutes: number;
      useBusinessHours?: boolean;
      calendarId?: string | null;
      warningThresholdPercent?: number;
      startTriggerState?: string | null;
      pauseStates?: string[];
      stopStates?: string[];
    },
    actor: Actor,
  ): Promise<SlaPolicyDefinition> {
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
      metricType: data.metricType ?? 'TIME_TO_RESOLUTION',
      durationMinutes: data.durationMinutes,
      useBusinessHours: data.useBusinessHours ?? true,
      calendar: data.calendarId ? { connect: { id: data.calendarId } } : undefined,
      warningThresholdPercent: data.warningThresholdPercent ?? 80,
      startTriggerState: data.startTriggerState,
      pauseStates: data.pauseStates ?? [],
      stopStates: data.stopStates ?? [],
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    return this.mapPolicyToDomain(created);
  }

  async publishPolicy(id: string, _actor: Actor): Promise<SlaPolicyDefinition> {
    const policy = await this.policyRepo.findById(id);
    if (!policy) {
      throw new NotFoundException(`SLA Policy with ID "${id}" not found`);
    }

    if (policy.status === 'PUBLISHED') return this.mapPolicyToDomain(policy);
    if (policy.status === 'RETIRED') {
      throw new BadRequestException('Cannot publish a retired SLA policy');
    }

    const updated = await this.policyRepo.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    return this.mapPolicyToDomain(updated);
  }

  async retirePolicy(id: string): Promise<SlaPolicyDefinition> {
    const updated = await this.policyRepo.update(id, {
      status: 'RETIRED',
    });
    return this.mapPolicyToDomain(updated);
  }

  async clonePolicyVersion(id: string, actor: Actor): Promise<SlaPolicyDefinition> {
    const existing = await this.policyRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`SLA Policy with ID "${id}" not found`);
    }

    const latestVersion = await this.policyRepo.getLatestVersionNumber(
      existing.organizationId,
      existing.communityId,
      existing.key,
    );

    const created = await this.policyRepo.create({
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
      metricType: existing.metricType,
      durationMinutes: existing.durationMinutes,
      useBusinessHours: existing.useBusinessHours,
      calendar: existing.calendarId ? { connect: { id: existing.calendarId } } : undefined,
      warningThresholdPercent: existing.warningThresholdPercent,
      startTriggerState: existing.startTriggerState,
      pauseStates: (existing.pauseStates ?? []) as unknown as Prisma.InputJsonValue,
      stopStates: (existing.stopStates ?? []) as unknown as Prisma.InputJsonValue,
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    return this.mapPolicyToDomain(created);
  }

  async getPolicyById(id: string): Promise<SlaPolicyDefinition> {
    const policy = await this.policyRepo.findById(id);
    if (!policy) {
      throw new NotFoundException(`SLA Policy with ID "${id}" not found`);
    }
    return this.mapPolicyToDomain(policy);
  }

  async listPolicies(params: {
    organizationId?: string | null;
    communityId?: string | null;
    status?: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
    skip?: number;
    take?: number;
  }): Promise<{ items: SlaPolicyDefinition[]; total: number }> {
    const res = await this.policyRepo.list(params);
    return {
      items: res.items.map((i) => this.mapPolicyToDomain(i)),
      total: res.total,
    };
  }

  // ===========================================================================
  // SLA RUNTIME INSTANCES
  // ===========================================================================

  /**
   * Starts tracking an SLA on a target resource.
   */
  async startSla(params: {
    policyKey: string;
    policyVersion?: number;
    organizationId?: string | null;
    communityId?: string | null;
    resourceType: string;
    resourceId: string;
    workflowInstanceId?: string | null;
    startTime?: Date;
  }): Promise<SlaInstance> {
    const startTime = params.startTime ?? new Date();

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
      throw new NotFoundException(`SLA Policy "${params.policyKey}" not found`);
    }

    let calendar: BusinessCalendar | null = null;
    if (policy.useBusinessHours) {
      if (policy.calendarId) {
        const calRec = await this.calendarRepo.findById(policy.calendarId);
        if (calRec) calendar = this.mapCalendarToDomain(calRec);
      }
      if (!calendar) {
        const defCal = await this.calendarRepo.findDefault(
          params.organizationId,
          params.communityId,
        );
        if (defCal) calendar = this.mapCalendarToDomain(defCal);
      }
    }

    const dueAt = this.calendarService.calculateDueAt(
      startTime,
      policy.durationMinutes,
      policy.useBusinessHours,
      calendar,
    );

    const warningAt = this.calendarService.calculateWarningAt(
      startTime,
      dueAt,
      policy.warningThresholdPercent,
      policy.useBusinessHours,
      calendar,
    );

    const created = await this.instanceRepo.create({
      policyDefinition: { connect: { id: policy.id } },
      policyKey: policy.key,
      policyVersion: policy.version,
      organization: params.organizationId ? { connect: { id: params.organizationId } } : undefined,
      community: params.communityId ? { connect: { id: params.communityId } } : undefined,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      workflowInstance: params.workflowInstanceId
        ? { connect: { id: params.workflowInstanceId } }
        : undefined,
      calendar: calendar ? { connect: { id: calendar.id } } : undefined,
      metricType: policy.metricType,
      durationMinutes: policy.durationMinutes,
      useBusinessHours: policy.useBusinessHours,
      startedAt: startTime,
      dueAt,
      warningAt,
      status: 'ACTIVE',
      warningNotified: false,
      breachNotified: false,
    });

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.SLA_STARTED,
        {
          slaInstanceId: created.id,
          policyKey: created.policyKey,
          resourceType: created.resourceType,
          resourceId: created.resourceId,
          dueAt: created.dueAt.toISOString(),
          warningAt: created.warningAt ? created.warningAt.toISOString() : null,
        },
        {
          organizationId: created.organizationId ?? undefined,
          communityId: created.communityId ?? undefined,
        },
      ),
    );

    return this.mapInstanceToDomain(created);
  }

  /**
   * Pauses an active SLA.
   */
  async pauseSla(id: string, pauseTime = new Date()): Promise<SlaInstance> {
    const existing = await this.instanceRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`SLA Instance "${id}" not found`);
    }

    if (existing.status !== 'ACTIVE') {
      return this.mapInstanceToDomain(existing);
    }

    const updated = await this.instanceRepo.update(id, {
      status: 'PAUSED',
      pausedAt: pauseTime,
    });

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.SLA_PAUSED,
        {
          slaInstanceId: updated.id,
          resourceType: updated.resourceType,
          resourceId: updated.resourceId,
          pausedAt: pauseTime.toISOString(),
        },
        {
          organizationId: updated.organizationId ?? undefined,
          communityId: updated.communityId ?? undefined,
        },
      ),
    );

    return this.mapInstanceToDomain(updated);
  }

  /**
   * Resumes a paused SLA and advances dueAt by the paused duration.
   */
  async resumeSla(id: string, resumeTime = new Date()): Promise<SlaInstance> {
    const existing = await this.instanceRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`SLA Instance "${id}" not found`);
    }

    if (existing.status !== 'PAUSED') {
      return this.mapInstanceToDomain(existing);
    }

    const pausedAt = existing.pausedAt ?? existing.updatedAt;
    const pausedMs = Math.max(0, resumeTime.getTime() - pausedAt.getTime());
    const additionalPausedMinutes = Math.floor(pausedMs / (60 * 1000));
    const totalPausedMinutes = existing.totalPausedMinutes + additionalPausedMinutes;

    const newDueAt = new Date(existing.dueAt.getTime() + pausedMs);
    const newWarningAt = existing.warningAt
      ? new Date(existing.warningAt.getTime() + pausedMs)
      : null;

    const updated = await this.instanceRepo.update(id, {
      status: 'ACTIVE',
      pausedAt: null,
      totalPausedMinutes,
      dueAt: newDueAt,
      warningAt: newWarningAt,
    });

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.SLA_RESUMED,
        {
          slaInstanceId: updated.id,
          resourceType: updated.resourceType,
          resourceId: updated.resourceId,
          newDueAt: newDueAt.toISOString(),
        },
        {
          organizationId: updated.organizationId ?? undefined,
          communityId: updated.communityId ?? undefined,
        },
      ),
    );

    return this.mapInstanceToDomain(updated);
  }

  /**
   * Completes an active or paused SLA.
   */
  async completeSla(id: string, completedTime = new Date()): Promise<SlaInstance> {
    const existing = await this.instanceRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`SLA Instance "${id}" not found`);
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      return this.mapInstanceToDomain(existing);
    }

    const updated = await this.instanceRepo.update(id, {
      status: 'COMPLETED',
      completedAt: completedTime,
    });

    await this.eventBus.publish(
      createEvent(
        DOMAIN_EVENTS.SLA_COMPLETED,
        {
          slaInstanceId: updated.id,
          resourceType: updated.resourceType,
          resourceId: updated.resourceId,
          completedAt: completedTime.toISOString(),
        },
        {
          organizationId: updated.organizationId ?? undefined,
          communityId: updated.communityId ?? undefined,
        },
      ),
    );

    return this.mapInstanceToDomain(updated);
  }

  async getActiveByWorkflow(workflowInstanceId: string): Promise<SlaInstance | null> {
    const rec = await this.instanceRepo.findActiveByWorkflow(workflowInstanceId);
    return rec ? this.mapInstanceToDomain(rec) : null;
  }

  async listInstances(params: {
    organizationId?: string | null;
    communityId?: string | null;
    resourceType?: string;
    resourceId?: string;
    workflowInstanceId?: string;
    status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'BREACHED' | 'CANCELLED';
    skip?: number;
    take?: number;
  }): Promise<{ items: SlaInstance[]; total: number }> {
    const res = await this.instanceRepo.list(params);
    return {
      items: res.items.map((i) => this.mapInstanceToDomain(i)),
      total: res.total,
    };
  }

  private mapPolicyToDomain(p: Record<string, unknown>): SlaPolicyDefinition {
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
      status: p.status as SlaPolicyStatus,
      metricType: p.metricType as SlaMetricType,
      durationMinutes: p.durationMinutes as number,
      useBusinessHours: p.useBusinessHours as boolean,
      calendarId: p.calendarId as string | null,
      warningThresholdPercent: p.warningThresholdPercent as number,
      startTriggerState: p.startTriggerState as string | null,
      pauseStates: (p.pauseStates ?? []) as string[],
      stopStates: (p.stopStates ?? []) as string[],
      createdById: p.createdById as string | null,
      publishedAt: p.publishedAt as Date | null,
      createdAt: p.createdAt as Date,
      updatedAt: p.updatedAt as Date,
    };
  }

  private mapInstanceToDomain(inst: Record<string, unknown>): SlaInstance {
    return {
      id: inst.id as string,
      policyDefinitionId: inst.policyDefinitionId as string,
      policyKey: inst.policyKey as string,
      policyVersion: inst.policyVersion as number,
      organizationId: inst.organizationId as string | null,
      communityId: inst.communityId as string | null,
      resourceType: inst.resourceType as string,
      resourceId: inst.resourceId as string,
      workflowInstanceId: inst.workflowInstanceId as string | null,
      calendarId: inst.calendarId as string | null,
      metricType: inst.metricType as SlaMetricType,
      durationMinutes: inst.durationMinutes as number,
      useBusinessHours: inst.useBusinessHours as boolean,
      startedAt: inst.startedAt as Date,
      dueAt: inst.dueAt as Date,
      warningAt: inst.warningAt as Date | null,
      pausedAt: inst.pausedAt as Date | null,
      totalPausedMinutes: inst.totalPausedMinutes as number,
      completedAt: inst.completedAt as Date | null,
      breachedAt: inst.breachedAt as Date | null,
      status: inst.status as SlaInstanceStatus,
      warningNotified: inst.warningNotified as boolean,
      breachNotified: inst.breachNotified as boolean,
      version: inst.version as number,
      createdAt: inst.createdAt as Date,
      updatedAt: inst.updatedAt as Date,
    };
  }

  private mapCalendarToDomain(c: Record<string, unknown>): BusinessCalendar {
    return {
      id: c.id as string,
      key: c.key as string,
      name: c.name as string,
      description: c.description as string | null,
      scopeType: c.scopeType as ScopeType,
      scopeId: c.scopeId as string | null,
      organizationId: c.organizationId as string | null,
      communityId: c.communityId as string | null,
      timezone: c.timezone as string,
      workingDays: (c.workingDays ?? [1, 2, 3, 4, 5]) as number[],
      workingHours: (c.workingHours ?? { start: '09:00', end: '17:00' }) as {
        start: string;
        end: string;
      },
      holidays: (c.holidays ?? []) as string[],
      exceptions: (c.exceptions ?? []) as BusinessCalendarException[],
      isDefault: c.isDefault as boolean,
      createdById: c.createdById as string | null,
      createdAt: c.createdAt as Date,
      updatedAt: c.updatedAt as Date,
    };
  }
}
