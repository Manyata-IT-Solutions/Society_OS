import type { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  WorkOrder,
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
  CompletionReviewOutcome,
  TicketWorkOrderRelationType,
  SlaInstanceStatus,
} from '@community-os/types';

export type WorkOrderWithRelations = WorkOrder & {
  category?: { name: string } | null;
  propertySection?: { name: string } | null;
  building?: { name: string } | null;
  floor?: { label: string } | null;
  unit?: { unitNumber: string } | null;
  primaryTeam?: { name: string } | null;
  primaryAssignee?: { displayName: string } | null;
  createdByUser?: { displayName: string } | null;
  verifiedByUser?: { displayName: string } | null;
  cancelledByUser?: { displayName: string } | null;
  maintenancePlan?: { name: string } | null;
  tasks?: Array<{
    id: string;
    workOrderId: string;
    title: string;
    description: string | null;
    sequence: number;
    isRequired: boolean;
    status: WorkOrderTaskStatus;
    assignedUserId: string | null;
    assignedUser?: { displayName: string } | null;
    completedById: string | null;
    completedByUser?: { displayName: string } | null;
    completedAt: Date | null;
    resultNotes: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  checklistResults?: Array<{
    id: string;
    workOrderId: string;
    checklistTemplateId: string | null;
    templateVersion: number | null;
    itemId: string;
    itemLabel: string;
    itemType: ChecklistItemType;
    isRequired: boolean;
    valueBoolean: boolean | null;
    valueText: string | null;
    valueNumber: number | null;
    valueDecimal: unknown;
    valueDate: Date | null;
    valueSelect: string | null;
    documentId: string | null;
    isPassed: boolean | null;
    failureComment: string | null;
    completedById: string | null;
    completedByUser?: { displayName: string } | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  workLogs?: Array<{
    id: string;
    workOrderId: string;
    userId: string;
    user?: { displayName: string } | null;
    type: WorkLogType;
    startedAt: Date | null;
    endedAt: Date | null;
    durationMinutes: number;
    notes: string | null;
    isManual: boolean;
    source: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  evidence?: Array<{
    id: string;
    workOrderId: string;
    documentId: string;
    evidenceType: WorkEvidenceType;
    caption: string | null;
    uploadedById: string;
    uploadedByUser?: { displayName: string } | null;
    createdAt: Date;
  }>;
  completionAttempts?: Array<{
    id: string;
    workOrderId: string;
    attemptNumber: number;
    submittedById: string;
    submittedByUser?: { displayName: string } | null;
    summary: string;
    reviewOutcome: CompletionReviewOutcome;
    reviewerId: string | null;
    reviewerUser?: { displayName: string } | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    createdAt: Date;
  }>;
  ticketLinks?: Array<{
    ticketId: string;
    workOrderId: string;
    relationshipType: TicketWorkOrderRelationType;
    ticket?: { ticketNumber: string; title: string } | null;
  }>;
  _count?: {
    tasks: number;
    ticketLinks: number;
  };
};

@Injectable()
export class WorkOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    communityId: string;
    workOrderNumber: string;
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
    scheduledOccurrenceAt?: Date | null;
    workflowInstanceId: string;
    slaInstanceId?: string | null;
    slaStatus?: SlaInstanceStatus | null;
    slaDueAt?: Date | null;
    currentState?: string;
    scheduledStartAt?: Date | null;
    scheduledEndAt?: Date | null;
    dueAt?: Date | null;
    primaryTeamId?: string | null;
    primaryAssigneeId?: string | null;
    createdById?: string | null;
  }): Promise<WorkOrder> {
    return this.prisma.workOrder.create({
      data: {
        organizationId: data.organizationId,
        communityId: data.communityId,
        workOrderNumber: data.workOrderNumber,
        title: data.title,
        description: data.description,
        workType: data.workType ?? 'CORRECTIVE',
        priority: data.priority ?? 'NORMAL',
        categoryId: data.categoryId ?? null,
        locationType: data.locationType ?? 'COMMON_AREA',
        propertySectionId: data.propertySectionId ?? null,
        buildingId: data.buildingId ?? null,
        floorId: data.floorId ?? null,
        unitId: data.unitId ?? null,
        locationDescription: data.locationDescription ?? null,
        source: data.source ?? 'MANUAL',
        maintenancePlanId: data.maintenancePlanId ?? null,
        planVersion: data.planVersion ?? null,
        scheduledOccurrenceAt: data.scheduledOccurrenceAt ?? null,
        workflowInstanceId: data.workflowInstanceId,
        slaInstanceId: data.slaInstanceId ?? null,
        slaStatus: data.slaStatus ?? null,
        slaDueAt: data.slaDueAt ?? null,
        currentState: data.currentState ?? 'DRAFT',
        scheduledStartAt: data.scheduledStartAt ?? null,
        scheduledEndAt: data.scheduledEndAt ?? null,
        dueAt: data.dueAt ?? null,
        primaryTeamId: data.primaryTeamId ?? null,
        primaryAssigneeId: data.primaryAssigneeId ?? null,
        createdById: data.createdById ?? null,
      },
    });
  }

  async findById(id: string): Promise<WorkOrderWithRelations | null> {
    return this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        propertySection: { select: { name: true } },
        building: { select: { name: true } },
        floor: { select: { label: true } },
        unit: { select: { unitNumber: true } },
        primaryTeam: { select: { name: true } },
        primaryAssignee: { select: { displayName: true } },
        createdByUser: { select: { displayName: true } },
        verifiedByUser: { select: { displayName: true } },
        cancelledByUser: { select: { displayName: true } },
        maintenancePlan: { select: { name: true } },
        tasks: {
          include: {
            assignedUser: { select: { displayName: true } },
            completedByUser: { select: { displayName: true } },
          },
          orderBy: { sequence: 'asc' },
        },
        checklistResults: {
          include: {
            completedByUser: { select: { displayName: true } },
          },
        },
        workLogs: {
          include: {
            user: { select: { displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        evidence: {
          include: {
            uploadedByUser: { select: { displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        completionAttempts: {
          include: {
            submittedByUser: { select: { displayName: true } },
            reviewerUser: { select: { displayName: true } },
          },
          orderBy: { attemptNumber: 'desc' },
        },
        ticketLinks: {
          include: {
            ticket: { select: { ticketNumber: true, title: true } },
          },
        },
      },
    }) as any;
  }

  async findByWorkOrderNumber(
    organizationId: string,
    communityId: string,
    workOrderNumber: string,
  ): Promise<WorkOrderWithRelations | null> {
    return this.prisma.workOrder.findUnique({
      where: {
        organizationId_communityId_workOrderNumber: {
          organizationId,
          communityId,
          workOrderNumber,
        },
      },
      include: {
        category: { select: { name: true } },
        propertySection: { select: { name: true } },
        building: { select: { name: true } },
        floor: { select: { label: true } },
        unit: { select: { unitNumber: true } },
        primaryTeam: { select: { name: true } },
        primaryAssignee: { select: { displayName: true } },
      },
    }) as any;
  }

  async findMany(filters: WorkOrderFilterParams): Promise<{
    items: WorkOrderWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkOrderWhereInput = {};
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.communityId) where.communityId = filters.communityId;
    if (filters.currentState) {
      where.currentState = Array.isArray(filters.currentState)
        ? { in: filters.currentState }
        : filters.currentState;
    }
    if (filters.workType) {
      where.workType = Array.isArray(filters.workType)
        ? { in: filters.workType }
        : filters.workType;
    }
    if (filters.priority) {
      where.priority = Array.isArray(filters.priority)
        ? { in: filters.priority }
        : filters.priority;
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.primaryTeamId) where.primaryTeamId = filters.primaryTeamId;
    if (filters.primaryAssigneeId) where.primaryAssigneeId = filters.primaryAssigneeId;
    if (filters.buildingId) where.buildingId = filters.buildingId;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.source) where.source = filters.source;
    if (filters.maintenancePlanId) where.maintenancePlanId = filters.maintenancePlanId;
    if (filters.isBlocked !== undefined) where.isBlocked = filters.isBlocked;
    if (filters.isOverdue) {
      where.dueAt = { lt: new Date() };
      where.currentState = { notIn: ['COMPLETED', 'CANCELLED'] };
    }
    if (filters.dueFrom || filters.dueTo) {
      where.dueAt = {
        ...(filters.dueFrom ? { gte: new Date(filters.dueFrom) } : {}),
        ...(filters.dueTo ? { lte: new Date(filters.dueTo) } : {}),
      };
    }
    if (filters.search) {
      where.OR = [
        { workOrderNumber: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        include: {
          category: { select: { name: true } },
          building: { select: { name: true } },
          unit: { select: { unitNumber: true } },
          primaryTeam: { select: { name: true } },
          primaryAssignee: { select: { displayName: true } },
          _count: {
            select: {
              tasks: true,
              ticketLinks: true,
            },
          },
        },
        orderBy: { [filters.sortBy ?? 'createdAt']: filters.sortOrder ?? 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return {
      items: items as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      workType: WorkOrderType;
      priority: WorkOrderPriority;
      categoryId: string | null;
      locationType: WorkOrderLocationType;
      propertySectionId: string | null;
      buildingId: string | null;
      floorId: string | null;
      unitId: string | null;
      locationDescription: string | null;
      currentState: string;
      scheduledStartAt: Date | null;
      scheduledEndAt: Date | null;
      actualStartAt: Date | null;
      actualEndAt: Date | null;
      dueAt: Date | null;
      primaryTeamId: string | null;
      primaryAssigneeId: string | null;
      isAccepted: boolean;
      acceptedAt: Date | null;
      isBlocked: boolean;
      blockedReason: string | null;
      blockedCategory: WorkOrderBlockerReason | null;
      blockedAt: Date | null;
      isPaused: boolean;
      pausedAt: Date | null;
      reworkCount: number;
      completionSummary: string | null;
      resolutionCode: string | null;
      verifiedById: string | null;
      verifiedAt: Date | null;
      cancelledById: string | null;
      cancelledAt: Date | null;
      cancellationReason: string | null;
      slaStatus: SlaInstanceStatus | null;
      slaDueAt: Date | null;
      slaWarningAt: Date | null;
      slaBreachedAt: Date | null;
      version: number;
    }>,
  ): Promise<WorkOrder> {
    return this.prisma.workOrder.update({
      where: { id },
      data,
    });
  }

  async recordAssignment(data: {
    workOrderId: string;
    fromTeamId?: string | null;
    toTeamId?: string | null;
    fromUserId?: string | null;
    toUserId?: string | null;
    assignedById: string;
    reason?: string | null;
  }): Promise<void> {
    await this.prisma.workOrderAssignmentHistory.create({
      data: {
        workOrderId: data.workOrderId,
        fromTeamId: data.fromTeamId ?? null,
        toTeamId: data.toTeamId ?? null,
        fromUserId: data.fromUserId ?? null,
        toUserId: data.toUserId ?? null,
        assignedById: data.assignedById,
        reason: data.reason ?? null,
      },
    });
  }

  async linkTicket(data: {
    ticketId: string;
    workOrderId: string;
    relationshipType?: TicketWorkOrderRelationType;
    createdById?: string | null;
  }): Promise<void> {
    await this.prisma.ticketWorkOrderLink.upsert({
      where: {
        ticketId_workOrderId_relationshipType: {
          ticketId: data.ticketId,
          workOrderId: data.workOrderId,
          relationshipType: data.relationshipType ?? 'GENERATED_FROM',
        },
      },
      update: {},
      create: {
        ticketId: data.ticketId,
        workOrderId: data.workOrderId,
        relationshipType: data.relationshipType ?? 'GENERATED_FROM',
        createdById: data.createdById ?? null,
      },
    });
  }

  async addTask(data: {
    workOrderId: string;
    title: string;
    description?: string | null;
    sequence?: number;
    isRequired?: boolean;
    assignedUserId?: string | null;
  }): Promise<unknown> {
    return this.prisma.workOrderTask.create({
      data: {
        workOrderId: data.workOrderId,
        title: data.title,
        description: data.description ?? null,
        sequence: data.sequence ?? 1,
        isRequired: data.isRequired ?? true,
        assignedUserId: data.assignedUserId ?? null,
      },
    });
  }

  async updateTask(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      sequence: number;
      isRequired: boolean;
      status: WorkOrderTaskStatus;
      assignedUserId: string | null;
      completedById: string | null;
      completedAt: Date | null;
      resultNotes: string | null;
    }>,
  ): Promise<unknown> {
    return this.prisma.workOrderTask.update({
      where: { id },
      data,
    });
  }

  async upsertChecklistResult(data: {
    workOrderId: string;
    checklistTemplateId?: string | null;
    templateVersion?: number | null;
    itemId: string;
    itemLabel: string;
    itemType: ChecklistItemType;
    isRequired?: boolean;
    valueBoolean?: boolean | null;
    valueText?: string | null;
    valueNumber?: number | null;
    valueDecimal?: unknown;
    valueDate?: Date | null;
    valueSelect?: string | null;
    documentId?: string | null;
    isPassed?: boolean | null;
    failureComment?: string | null;
    completedById?: string | null;
    completedAt?: Date | null;
  }): Promise<unknown> {
    return this.prisma.workOrderChecklistResult.upsert({
      where: {
        workOrderId_itemId: {
          workOrderId: data.workOrderId,
          itemId: data.itemId,
        },
      },
      update: {
        ...data,
        completedAt: data.completedAt ?? new Date(),
      } as any,
      create: {
        ...data,
        completedAt: data.completedAt ?? new Date(),
      } as any,
    });
  }

  async createWorkLog(data: {
    workOrderId: string;
    userId: string;
    type?: WorkLogType;
    startedAt?: Date | null;
    endedAt?: Date | null;
    durationMinutes?: number;
    notes?: string | null;
    isManual?: boolean;
    source?: string;
  }): Promise<unknown> {
    return this.prisma.workLog.create({
      data: {
        workOrderId: data.workOrderId,
        userId: data.userId,
        type: data.type ?? 'WORK',
        startedAt: data.startedAt ?? null,
        endedAt: data.endedAt ?? null,
        durationMinutes: data.durationMinutes ?? 0,
        notes: data.notes ?? null,
        isManual: data.isManual ?? false,
        source: data.source ?? 'WEB',
      },
    });
  }

  async findActiveWorkLog(userId: string): Promise<unknown> {
    return this.prisma.workLog.findFirst({
      where: {
        userId,
        endedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async stopWorkLog(
    id: string,
    endedAt: Date,
    durationMinutes: number,
    notes?: string | null,
  ): Promise<unknown> {
    return this.prisma.workLog.update({
      where: { id },
      data: {
        endedAt,
        durationMinutes,
        ...(notes ? { notes } : {}),
      },
    });
  }

  async attachEvidence(data: any): Promise<unknown> {
    return this.addEvidence(data);
  }

  async recordCompletionAttempt(data: any): Promise<unknown> {
    return this.createCompletionAttempt(data);
  }

  async addEvidence(data: {
    workOrderId: string;
    documentId: string;
    evidenceType?: WorkEvidenceType;
    caption?: string | null;
    uploadedById: string;
  }): Promise<unknown> {
    return this.prisma.workOrderEvidence.create({
      data: {
        workOrderId: data.workOrderId,
        documentId: data.documentId,
        evidenceType: data.evidenceType ?? 'WORK_ORDER_ATTACHMENT',
        caption: data.caption ?? null,
        uploadedById: data.uploadedById,
      },
    });
  }

  async createCompletionAttempt(data: {
    workOrderId: string;
    attemptNumber: number;
    submittedById: string;
    summary: string;
    reviewOutcome?: CompletionReviewOutcome;
    reviewerId?: string | null;
    reviewedAt?: Date | null;
    reviewNotes?: string | null;
  }): Promise<unknown> {
    return this.prisma.workCompletionAttempt.create({
      data: {
        workOrderId: data.workOrderId,
        attemptNumber: data.attemptNumber,
        submittedById: data.submittedById,
        summary: data.summary,
        reviewOutcome: data.reviewOutcome ?? 'APPROVED',
        reviewerId: data.reviewerId ?? null,
        reviewedAt: data.reviewedAt ?? null,
        reviewNotes: data.reviewNotes ?? null,
      },
    });
  }

  async getKpiMetrics(organizationId: string, communityId?: string | null): Promise<unknown> {
    const where: Prisma.WorkOrderWhereInput = { organizationId };
    if (communityId) where.communityId = communityId;

    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const [
      totalOpen,
      unassigned,
      inProgress,
      blocked,
      waitingReview,
      overdue,
      completedToday,
      activeTimersCount,
      allForBreakdown,
    ] = await Promise.all([
      this.prisma.workOrder.count({
        where: { ...where, currentState: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      this.prisma.workOrder.count({
        where: {
          ...where,
          primaryAssigneeId: null,
          currentState: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      this.prisma.workOrder.count({
        where: { ...where, currentState: 'IN_PROGRESS' },
      }),
      this.prisma.workOrder.count({
        where: { ...where, isBlocked: true, currentState: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      this.prisma.workOrder.count({
        where: { ...where, currentState: 'WAITING_REVIEW' },
      }),
      this.prisma.workOrder.count({
        where: {
          ...where,
          dueAt: { lt: now },
          currentState: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      this.prisma.workOrder.count({
        where: {
          ...where,
          currentState: 'COMPLETED',
          updatedAt: { gte: startOfToday },
        },
      }),
      this.prisma.workLog.count({
        where: {
          endedAt: null,
          workOrder: where,
        },
      }),
      this.prisma.workOrder.findMany({
        where,
        select: {
          priority: true,
          currentState: true,
          workType: true,
          category: { select: { name: true } },
        },
      }),
    ]);

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const wo of allForBreakdown) {
      const catName = wo.category?.name || 'Uncategorized';
      byCategory[catName] = (byCategory[catName] || 0) + 1;
      byPriority[wo.priority] = (byPriority[wo.priority] || 0) + 1;
      byStatus[wo.currentState] = (byStatus[wo.currentState] || 0) + 1;
    }

    // Preventive compliance
    const preventiveTotal = allForBreakdown.filter((w) => w.workType === 'PREVENTIVE').length;
    const preventiveCompleted = allForBreakdown.filter(
      (w) => w.workType === 'PREVENTIVE' && w.currentState === 'COMPLETED',
    ).length;
    const preventiveCompliancePercentage =
      preventiveTotal > 0 ? Math.round((preventiveCompleted / preventiveTotal) * 100) : 100;

    return {
      totalOpen,
      unassigned,
      inProgress,
      blocked,
      waitingReview,
      dueToday: 0,
      overdue,
      completedToday,
      preventiveCompliancePercentage,
      activeTimersCount,
      byCategory,
      byPriority,
      byStatus,
    };
  }
}
