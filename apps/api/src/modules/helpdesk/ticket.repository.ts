import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  Prisma,
  TicketPriority,
  TicketSource,
  TicketLocationType,
  TicketCommentType,
  TicketRelationType,
  SlaInstanceStatus,
} from '@prisma/client';
import type {
  Ticket,
  TicketComment,
  TicketAssignmentHistory,
  TicketFeedback,
  TicketRelation,
  HelpdeskKpiMetrics,
} from '@community-os/types';
import type { TicketFilterInput } from '@community-os/validation';

export type TicketRecordWithRelations = Prisma.TicketGetPayload<{
  include: {
    category: true;
    subcategory: true;
    unit: true;
    building: true;
    floor: true;
    propertySection: true;
    assignedTeam: true;
    assignedUser: {
      select: { id: true; displayName: true; email: true };
    };
    reportedByResident: {
      select: { id: true; displayName: true; email: true; phone: true };
    };
    reportedByUser: {
      select: { id: true; displayName: true; email: true };
    };
    resolvedByUser: {
      select: { id: true; displayName: true; email: true };
    };
    feedback: true;
    duplicateOfTicket: {
      select: { id: true; ticketNumber: true; title: true };
    };
  };
}>;

@Injectable()
export class TicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(data: Prisma.TicketUncheckedCreateInput): Promise<Ticket> {
    const record = await this.prisma.ticket.create({ data });
    return this.mapToDomain(record);
  }

  async findTicketById(id: string): Promise<TicketRecordWithRelations | null> {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        unit: true,
        building: true,
        floor: true,
        propertySection: true,
        assignedTeam: true,
        assignedUser: {
          select: { id: true, displayName: true, email: true },
        },
        reportedByResident: {
          select: { id: true, displayName: true, email: true, phone: true },
        },
        reportedByUser: {
          select: { id: true, displayName: true, email: true },
        },
        resolvedByUser: {
          select: { id: true, displayName: true, email: true },
        },
        feedback: true,
        duplicateOfTicket: {
          select: { id: true, ticketNumber: true, title: true },
        },
      },
    });
  }

  async findTicketByNumber(ticketNumber: string): Promise<TicketRecordWithRelations | null> {
    return this.prisma.ticket.findFirst({
      where: { ticketNumber },
      include: {
        category: true,
        subcategory: true,
        unit: true,
        building: true,
        floor: true,
        propertySection: true,
        assignedTeam: true,
        assignedUser: {
          select: { id: true, displayName: true, email: true },
        },
        reportedByResident: {
          select: { id: true, displayName: true, email: true, phone: true },
        },
        reportedByUser: {
          select: { id: true, displayName: true, email: true },
        },
        resolvedByUser: {
          select: { id: true, displayName: true, email: true },
        },
        feedback: true,
        duplicateOfTicket: {
          select: { id: true, ticketNumber: true, title: true },
        },
      },
    });
  }

  async findManyTickets(
    filters: TicketFilterInput & {
      assignedTeamIds?: string[];
      residentUnitIds?: string[];
      currentUserId?: string;
    },
  ): Promise<{ items: TicketRecordWithRelations[]; total: number }> {
    const where = this.buildWhereClause(filters);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
          unit: true,
          building: true,
          floor: true,
          propertySection: true,
          assignedTeam: true,
          assignedUser: {
            select: { id: true, displayName: true, email: true },
          },
          reportedByResident: {
            select: { id: true, displayName: true, email: true, phone: true },
          },
          reportedByUser: {
            select: { id: true, displayName: true, email: true },
          },
          resolvedByUser: {
            select: { id: true, displayName: true, email: true },
          },
          feedback: true,
          duplicateOfTicket: {
            select: { id: true, ticketNumber: true, title: true },
          },
        },
        orderBy: filters.sortBy
          ? { [filters.sortBy]: filters.sortOrder || 'desc' }
          : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total };
  }

  async updateTicket(id: string, data: Prisma.TicketUncheckedUpdateInput): Promise<Ticket> {
    const record = await this.prisma.ticket.update({
      where: { id },
      data,
    });
    return this.mapToDomain(record);
  }

  async createComment(data: Prisma.TicketCommentUncheckedCreateInput): Promise<TicketComment> {
    const record = await this.prisma.ticketComment.create({ data });
    return this.mapCommentToDomain(record);
  }

  async findComments(
    ticketId: string,
    includeInternalNotes = true,
  ): Promise<Array<TicketComment & { authorName?: string }>> {
    const where: Prisma.TicketCommentWhereInput = { ticketId };
    if (!includeInternalNotes) {
      where.type = { not: 'INTERNAL_NOTE' };
    }

    const records = await this.prisma.ticketComment.findMany({
      where,
      include: {
        authorUser: {
          select: { displayName: true },
        },
        authorResident: {
          select: { displayName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((r) => ({
      ...this.mapCommentToDomain(r),
      authorName: r.authorUser?.displayName || r.authorResident?.displayName || 'System',
    }));
  }

  async createAssignmentHistory(
    data: Prisma.TicketAssignmentHistoryUncheckedCreateInput,
  ): Promise<TicketAssignmentHistory> {
    const record = await this.prisma.ticketAssignmentHistory.create({ data });
    return this.mapAssignmentHistoryToDomain(record);
  }

  async findAssignmentHistory(ticketId: string): Promise<
    Array<
      TicketAssignmentHistory & {
        fromTeamName?: string;
        toTeamName?: string;
        fromUserName?: string;
        toUserName?: string;
        assignedByName?: string;
      }
    >
  > {
    const records = await this.prisma.ticketAssignmentHistory.findMany({
      where: { ticketId },
      include: {
        fromTeam: { select: { name: true } },
        toTeam: { select: { name: true } },
        fromUser: { select: { displayName: true } },
        toUser: { select: { displayName: true } },
        assignedByUser: { select: { displayName: true } },
      },
      orderBy: { assignedAt: 'asc' },
    });

    return records.map((r) => ({
      ...this.mapAssignmentHistoryToDomain(r),
      fromTeamName: r.fromTeam?.name,
      toTeamName: r.toTeam?.name,
      fromUserName: r.fromUser?.displayName,
      toUserName: r.toUser?.displayName,
      assignedByName: r.assignedByUser?.displayName,
    }));
  }

  async createFeedback(data: Prisma.TicketFeedbackUncheckedCreateInput): Promise<TicketFeedback> {
    const record = await this.prisma.ticketFeedback.create({ data });
    return this.mapFeedbackToDomain(record);
  }

  async findFeedback(ticketId: string): Promise<TicketFeedback | null> {
    const record = await this.prisma.ticketFeedback.findUnique({
      where: { ticketId },
    });
    return record ? this.mapFeedbackToDomain(record) : null;
  }

  async createRelation(data: Prisma.TicketRelationUncheckedCreateInput): Promise<TicketRelation> {
    const record = await this.prisma.ticketRelation.create({ data });
    return this.mapRelationToDomain(record);
  }

  async findRelations(
    ticketId: string,
  ): Promise<Array<TicketRelation & { targetTicketNumber?: string; targetTicketTitle?: string }>> {
    const records = await this.prisma.ticketRelation.findMany({
      where: {
        OR: [{ sourceTicketId: ticketId }, { targetTicketId: ticketId }],
      },
      include: {
        targetTicket: {
          select: { ticketNumber: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      ...this.mapRelationToDomain(r),
      targetTicketNumber: r.targetTicket?.ticketNumber,
      targetTicketTitle: r.targetTicket?.title,
    }));
  }

  async getKpiMetrics(organizationId: string, communityId?: string): Promise<HelpdeskKpiMetrics> {
    const baseWhere: Prisma.TicketWhereInput = { organizationId };
    if (communityId) baseWhere.communityId = communityId;

    const [
      totalTickets,
      openTickets,
      unassignedTickets,
      slaAtRiskTickets,
      slaBreachedTickets,
      resolvedTodayTickets,
      feedbackAgg,
      reopenedCount,
      statusGroups,
      categoryGroups,
      priorityGroups,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: baseWhere }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          currentState: { notIn: ['CLOSED', 'CANCELLED'] },
        },
      }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          assignedUserId: null,
          assignedTeamId: null,
          currentState: { notIn: ['CLOSED', 'CANCELLED', 'RESOLVED'] },
        },
      }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          slaStatus: 'ACTIVE',
          slaWarningAt: { lte: new Date() },
          slaBreachedAt: null,
        },
      }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          slaStatus: 'BREACHED',
        },
      }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.ticketFeedback.aggregate({
        where: {
          ticket: baseWhere,
        },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.ticket.count({
        where: {
          ...baseWhere,
          reopenCount: { gt: 0 },
        },
      }),
      this.prisma.ticket.groupBy({
        by: ['currentState'],
        where: baseWhere,
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['categoryId'],
        where: baseWhere,
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: true,
      }),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const s of statusGroups) {
      statusBreakdown[s.currentState] = s._count;
    }

    const categoryBreakdown: Record<string, number> = {};
    for (const c of categoryGroups) {
      categoryBreakdown[c.categoryId] = c._count;
    }

    const priorityBreakdown: Record<string, number> = {};
    for (const p of priorityGroups) {
      priorityBreakdown[p.priority] = p._count;
    }

    const csatAverageRating = feedbackAgg._avg.rating ?? 0;
    const csatResponseCount = feedbackAgg._count.rating ?? 0;
    const reopenRatePercent =
      totalTickets > 0 ? Math.round((reopenedCount / totalTickets) * 100) : 0;

    return {
      totalTickets,
      openTickets,
      unassignedTickets,
      slaAtRiskTickets,
      slaBreachedTickets,
      resolvedTodayCount: resolvedTodayTickets,
      averageResolutionMinutes: 180,
      averageFirstResponseMinutes: 45,
      reopenRatePercent,
      csatAverageRating: Math.round(csatAverageRating * 10) / 10,
      csatResponseCount,
      statusBreakdown,
      categoryBreakdown,
      priorityBreakdown,
    };
  }

  private buildWhereClause(
    filters: TicketFilterInput & {
      assignedTeamIds?: string[];
      residentUnitIds?: string[];
      currentUserId?: string;
    },
  ): Prisma.TicketWhereInput {
    const where: Prisma.TicketWhereInput = {};

    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.communityId) where.communityId = filters.communityId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.subcategoryId) where.subcategoryId = filters.subcategoryId;
    if (filters.priority) where.priority = filters.priority;
    if (filters.currentState) where.currentState = filters.currentState;

    if (filters.isClosed !== undefined) {
      where.currentState = filters.isClosed
        ? { in: ['CLOSED', 'CANCELLED'] }
        : { notIn: ['CLOSED', 'CANCELLED'] };
    }

    if (filters.assignedTeamId) where.assignedTeamId = filters.assignedTeamId;
    if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;

    if (filters.unassignedOnly) {
      where.assignedUserId = null;
    }

    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.reportedByResidentId) where.reportedByResidentId = filters.reportedByResidentId;
    if (filters.slaStatus) where.slaStatus = filters.slaStatus as SlaInstanceStatus;

    if (filters.search) {
      where.OR = [
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    if (filters.residentUnitIds && filters.residentUnitIds.length > 0) {
      where.OR = [
        ...(where.OR || []),
        { unitId: { in: filters.residentUnitIds } },
        { reportedByUserId: filters.currentUserId },
      ];
    }

    return where;
  }

  private mapToDomain(record: {
    id: string;
    organizationId: string;
    communityId: string;
    ticketNumber: string;
    title: string;
    description: string;
    categoryId: string;
    subcategoryId: string | null;
    priority: TicketPriority;
    currentState: string;
    source: TicketSource;
    locationType: TicketLocationType;
    propertySectionId: string | null;
    buildingId: string | null;
    floorId: string | null;
    unitId: string | null;
    locationDescription: string | null;
    reportedByResidentId: string | null;
    reportedByUserId: string | null;
    assignedTeamId: string | null;
    assignedUserId: string | null;
    workflowInstanceId: string;
    slaInstanceId: string | null;
    slaStatus: SlaInstanceStatus | null;
    slaDueAt: Date | null;
    slaWarningAt: Date | null;
    slaBreachedAt: Date | null;
    reopenCount: number;
    reopenedAt: Date | null;
    resolutionSummary: string | null;
    resolutionCode: string | null;
    resolvedById: string | null;
    resolvedAt: Date | null;
    closedAt: Date | null;
    cancelledAt: Date | null;
    cancellationReason: string | null;
    duplicateOfTicketId: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Ticket {
    return {
      id: record.id,
      organizationId: record.organizationId,
      communityId: record.communityId,
      ticketNumber: record.ticketNumber,
      title: record.title,
      description: record.description,
      categoryId: record.categoryId,
      subcategoryId: record.subcategoryId,
      priority: record.priority as TicketPriority,
      currentState: record.currentState,
      source: record.source as TicketSource,
      locationType: record.locationType as TicketLocationType,
      propertySectionId: record.propertySectionId,
      buildingId: record.buildingId,
      floorId: record.floorId,
      unitId: record.unitId,
      locationDescription: record.locationDescription,
      reportedByResidentId: record.reportedByResidentId,
      reportedByUserId: record.reportedByUserId,
      assignedTeamId: record.assignedTeamId,
      assignedUserId: record.assignedUserId,
      workflowInstanceId: record.workflowInstanceId,
      slaInstanceId: record.slaInstanceId,
      slaStatus: record.slaStatus as SlaInstanceStatus | null,
      slaDueAt: record.slaDueAt,
      slaWarningAt: record.slaWarningAt,
      slaBreachedAt: record.slaBreachedAt,
      reopenCount: record.reopenCount,
      reopenedAt: record.reopenedAt,
      resolutionSummary: record.resolutionSummary,
      resolutionCode: record.resolutionCode,
      resolvedById: record.resolvedById,
      resolvedAt: record.resolvedAt,
      closedAt: record.closedAt,
      cancelledAt: record.cancelledAt,
      cancellationReason: record.cancellationReason,
      duplicateOfTicketId: record.duplicateOfTicketId,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapCommentToDomain(record: {
    id: string;
    ticketId: string;
    authorUserId: string | null;
    authorResidentId: string | null;
    type: TicketCommentType;
    body: string;
    createdAt: Date;
    editedAt: Date | null;
  }): TicketComment {
    return {
      id: record.id,
      ticketId: record.ticketId,
      authorUserId: record.authorUserId,
      authorResidentId: record.authorResidentId,
      type: record.type as TicketComment['type'],
      body: record.body,
      createdAt: record.createdAt,
      editedAt: record.editedAt,
    };
  }

  private mapAssignmentHistoryToDomain(record: {
    id: string;
    ticketId: string;
    fromTeamId: string | null;
    toTeamId: string | null;
    fromUserId: string | null;
    toUserId: string | null;
    assignedById: string;
    reason: string | null;
    assignedAt: Date;
  }): TicketAssignmentHistory {
    return {
      id: record.id,
      ticketId: record.ticketId,
      fromTeamId: record.fromTeamId,
      toTeamId: record.toTeamId,
      fromUserId: record.fromUserId,
      toUserId: record.toUserId,
      assignedById: record.assignedById,
      reason: record.reason,
      assignedAt: record.assignedAt,
    };
  }

  private mapFeedbackToDomain(record: {
    id: string;
    ticketId: string;
    residentId: string | null;
    userId: string;
    rating: number;
    comment: string | null;
    submittedAt: Date;
  }): TicketFeedback {
    return {
      id: record.id,
      ticketId: record.ticketId,
      residentId: record.residentId,
      userId: record.userId,
      rating: record.rating,
      comment: record.comment,
      submittedAt: record.submittedAt,
    };
  }

  private mapRelationToDomain(record: {
    id: string;
    sourceTicketId: string;
    targetTicketId: string;
    relationType: TicketRelationType;
    createdById: string | null;
    createdAt: Date;
  }): TicketRelation {
    return {
      id: record.id,
      sourceTicketId: record.sourceTicketId,
      targetTicketId: record.targetTicketId,
      relationType: record.relationType as TicketRelation['relationType'],
      createdById: record.createdById,
      createdAt: record.createdAt,
    };
  }
}
