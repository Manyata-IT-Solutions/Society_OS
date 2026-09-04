import type { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  MaintenancePlan,
  MaintenancePlanStatus,
  MaintenanceScheduleType,
  MaintenanceMissedPolicy,
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderLocationType,
  MaintenancePlanFilterParams,
} from '@community-os/types';

export type MaintenancePlanWithRelations = MaintenancePlan & {
  workCategory?: { name: string } | null;
  defaultTeam?: { name: string } | null;
  checklistTemplate?: { name: string } | null;
  targetBuilding?: { name: string } | null;
  targetUnit?: { unitNumber: string } | null;
};

@Injectable()
export class MaintenancePlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    communityId: string;
    name: string;
    code: string;
    description?: string | null;
    status?: MaintenancePlanStatus;
    workCategoryId?: string | null;
    workType?: WorkOrderType;
    scheduleType?: MaintenanceScheduleType;
    scheduleDefinition: Prisma.InputJsonValue;
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
    nextRunAt?: Date | null;
    createdById?: string | null;
  }): Promise<MaintenancePlanWithRelations> {
    return this.prisma.maintenancePlan.create({
      data: {
        organizationId: data.organizationId,
        communityId: data.communityId,
        name: data.name,
        code: data.code,
        description: data.description ?? null,
        status: data.status ?? 'DRAFT',
        workCategoryId: data.workCategoryId ?? null,
        workType: data.workType ?? 'PREVENTIVE',
        scheduleType: data.scheduleType ?? 'MONTHLY',
        scheduleDefinition: data.scheduleDefinition,
        timezone: data.timezone ?? 'UTC',
        businessCalendarId: data.businessCalendarId ?? null,
        defaultPriority: data.defaultPriority ?? 'NORMAL',
        defaultTeamId: data.defaultTeamId ?? null,
        workflowDefinitionId: data.workflowDefinitionId ?? null,
        checklistTemplateId: data.checklistTemplateId ?? null,
        estimatedDurationMinutes: data.estimatedDurationMinutes ?? null,
        generationPolicy: data.generationPolicy ?? 'SKIP_MISSED',
        leadTimeDays: data.leadTimeDays ?? 0,
        targetLocationType: data.targetLocationType ?? 'COMMUNITY',
        targetSectionId: data.targetSectionId ?? null,
        targetBuildingId: data.targetBuildingId ?? null,
        targetFloorId: data.targetFloorId ?? null,
        targetUnitId: data.targetUnitId ?? null,
        targetLocationDescription: data.targetLocationDescription ?? null,
        nextRunAt: data.nextRunAt ?? null,
        createdById: data.createdById ?? null,
      },
      include: {
        workCategory: { select: { name: true } },
        defaultTeam: { select: { name: true } },
        checklistTemplate: { select: { name: true } },
        targetBuilding: { select: { name: true } },
        targetUnit: { select: { unitNumber: true } },
      },
    }) as any;
  }

  async findById(id: string): Promise<MaintenancePlanWithRelations | null> {
    return this.prisma.maintenancePlan.findUnique({
      where: { id },
      include: {
        workCategory: { select: { name: true } },
        defaultTeam: { select: { name: true } },
        checklistTemplate: { select: { name: true } },
        targetBuilding: { select: { name: true } },
        targetUnit: { select: { unitNumber: true } },
      },
    }) as any;
  }

  async findByCode(
    organizationId: string,
    communityId: string,
    code: string,
  ): Promise<MaintenancePlanWithRelations | null> {
    return this.prisma.maintenancePlan.findUnique({
      where: {
        organizationId_communityId_code: {
          organizationId,
          communityId,
          code,
        },
      },
      include: {
        workCategory: { select: { name: true } },
        defaultTeam: { select: { name: true } },
        checklistTemplate: { select: { name: true } },
        targetBuilding: { select: { name: true } },
        targetUnit: { select: { unitNumber: true } },
      },
    }) as any;
  }

  async findMany(filters: MaintenancePlanFilterParams): Promise<{
    items: MaintenancePlanWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenancePlanWhereInput = {};
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.communityId) where.communityId = filters.communityId;
    if (filters.status) {
      where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
    }
    if (filters.workCategoryId) where.workCategoryId = filters.workCategoryId;
    if (filters.defaultTeamId) where.defaultTeamId = filters.defaultTeamId;
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.maintenancePlan.findMany({
        where,
        include: {
          workCategory: { select: { name: true } },
          defaultTeam: { select: { name: true } },
          checklistTemplate: { select: { name: true } },
          targetBuilding: { select: { name: true } },
          targetUnit: { select: { unitNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.maintenancePlan.count({ where }),
    ]);

    return {
      items: items as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDuePlans(now: Date = new Date(), limit = 50): Promise<MaintenancePlanWithRelations[]> {
    return this.prisma.maintenancePlan.findMany({
      where: {
        status: 'ACTIVE',
        nextRunAt: { lte: now },
      },
      include: {
        workCategory: { select: { name: true } },
        defaultTeam: { select: { name: true } },
        checklistTemplate: { select: { name: true } },
        targetBuilding: { select: { name: true } },
        targetUnit: { select: { unitNumber: true } },
      },
      take: limit,
      orderBy: { nextRunAt: 'asc' },
    }) as any;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      status: MaintenancePlanStatus;
      workCategoryId: string | null;
      workType: WorkOrderType;
      scheduleType: MaintenanceScheduleType;
      scheduleDefinition: Prisma.InputJsonValue;
      timezone: string;
      businessCalendarId: string | null;
      defaultPriority: WorkOrderPriority;
      defaultTeamId: string | null;
      workflowDefinitionId: string | null;
      checklistTemplateId: string | null;
      estimatedDurationMinutes: number | null;
      generationPolicy: MaintenanceMissedPolicy;
      leadTimeDays: number;
      targetLocationType: WorkOrderLocationType;
      targetSectionId: string | null;
      targetBuildingId: string | null;
      targetFloorId: string | null;
      targetUnitId: string | null;
      targetLocationDescription: string | null;
      nextRunAt: Date | null;
      lastRunAt: Date | null;
      version: number;
    }>,
  ): Promise<MaintenancePlanWithRelations> {
    return this.prisma.maintenancePlan.update({
      where: { id },
      data,
      include: {
        workCategory: { select: { name: true } },
        defaultTeam: { select: { name: true } },
        checklistTemplate: { select: { name: true } },
        targetBuilding: { select: { name: true } },
        targetUnit: { select: { unitNumber: true } },
      },
    }) as any;
  }

  async findOccurrence(maintenancePlanId: string, occurrenceKey: string): Promise<unknown> {
    return this.prisma.maintenancePlanOccurrence.findUnique({
      where: {
        maintenancePlanId_occurrenceKey: {
          maintenancePlanId,
          occurrenceKey,
        },
      },
    });
  }

  async recordOccurrence(data: {
    maintenancePlanId: string;
    occurrenceKey: string;
    scheduledAt: Date;
    workOrderId?: string | null;
    status?: string;
  }): Promise<unknown> {
    return this.prisma.maintenancePlanOccurrence.create({
      data: {
        maintenancePlanId: data.maintenancePlanId,
        occurrenceKey: data.occurrenceKey,
        scheduledAt: data.scheduledAt,
        workOrderId: data.workOrderId ?? null,
        status: data.status ?? 'GENERATED',
      },
    });
  }
}
