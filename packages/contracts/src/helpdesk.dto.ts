import type {
  Ticket,
  TicketCategory,
  HelpdeskTeam,
  HelpdeskTeamMember,
  TicketComment,
  TicketFeedback,
  TicketRelation,
  TicketTimelineItem,
  HelpdeskKpiMetrics,
  TicketPriority,
  TicketSource,
  TicketLocationType,
  TicketCommentType,
  TicketCategoryStatus,
  HelpdeskTeamStatus,
  TicketRelationType,
  SlaInstanceStatus,
} from '@community-os/types';

// =============================================================================
// HELPDESK CATEGORY DTOS & MAPPERS
// =============================================================================

export interface TicketCategoryResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  parentId: string | null;
  key: string;
  name: string;
  description: string | null;
  status: TicketCategoryStatus;
  defaultPriority: TicketPriority;
  defaultSlaPolicyId: string | null;
  defaultTeamId: string | null;
  workflowDefinitionId: string | null;
  residentVisible: boolean;
  isSensitive: boolean;
  allowAttachments: boolean;
  displayOrder: number;
  subcategories?: TicketCategoryResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toTicketCategoryDto(
  category: TicketCategory,
  subcategories?: TicketCategory[],
): TicketCategoryResponseDto {
  return {
    id: category.id,
    organizationId: category.organizationId,
    communityId: category.communityId,
    parentId: category.parentId,
    key: category.key,
    name: category.name,
    description: category.description,
    status: category.status,
    defaultPriority: category.defaultPriority,
    defaultSlaPolicyId: category.defaultSlaPolicyId,
    defaultTeamId: category.defaultTeamId,
    workflowDefinitionId: category.workflowDefinitionId,
    residentVisible: category.residentVisible,
    isSensitive: category.isSensitive,
    allowAttachments: category.allowAttachments,
    displayOrder: category.displayOrder,
    subcategories: subcategories?.map((sc) => toTicketCategoryDto(sc)),
    createdAt:
      category.createdAt instanceof Date ? category.createdAt.toISOString() : category.createdAt,
    updatedAt:
      category.updatedAt instanceof Date ? category.updatedAt.toISOString() : category.updatedAt,
  };
}

// =============================================================================
// HELPDESK TEAM DTOS & MAPPERS
// =============================================================================

export interface HelpdeskTeamMemberResponseDto {
  id: string;
  teamId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  roleInTeam: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toHelpdeskTeamMemberDto(
  member: HelpdeskTeamMember,
  user?: { name?: string; email?: string } | null,
): HelpdeskTeamMemberResponseDto {
  return {
    id: member.id,
    teamId: member.teamId,
    userId: member.userId,
    userName: user?.name,
    userEmail: user?.email,
    roleInTeam: member.roleInTeam,
    isActive: member.isActive,
    createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : member.createdAt,
    updatedAt: member.updatedAt instanceof Date ? member.updatedAt.toISOString() : member.updatedAt,
  };
}

export interface HelpdeskTeamResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  key: string;
  name: string;
  description: string | null;
  status: HelpdeskTeamStatus;
  memberCount?: number;
  members?: HelpdeskTeamMemberResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toHelpdeskTeamDto(
  team: HelpdeskTeam,
  members?: Array<HelpdeskTeamMember & { user?: { name?: string; email?: string } }>,
): HelpdeskTeamResponseDto {
  return {
    id: team.id,
    organizationId: team.organizationId,
    communityId: team.communityId,
    key: team.key,
    name: team.name,
    description: team.description,
    status: team.status,
    memberCount: members ? members.length : undefined,
    members: members?.map((m) => toHelpdeskTeamMemberDto(m, m.user)),
    createdAt: team.createdAt instanceof Date ? team.createdAt.toISOString() : team.createdAt,
    updatedAt: team.updatedAt instanceof Date ? team.updatedAt.toISOString() : team.updatedAt,
  };
}

// =============================================================================
// TICKET COMMENT & FEEDBACK DTOS
// =============================================================================

export interface TicketCommentResponseDto {
  id: string;
  ticketId: string;
  authorUserId: string | null;
  authorResidentId: string | null;
  authorName?: string;
  type: TicketCommentType;
  body: string;
  createdAt: string;
  editedAt: string | null;
}

export function toTicketCommentDto(
  comment: TicketComment,
  authorName?: string,
): TicketCommentResponseDto {
  return {
    id: comment.id,
    ticketId: comment.ticketId,
    authorUserId: comment.authorUserId,
    authorResidentId: comment.authorResidentId,
    authorName,
    type: comment.type,
    body: comment.body,
    createdAt:
      comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
    editedAt: comment.editedAt
      ? comment.editedAt instanceof Date
        ? comment.editedAt.toISOString()
        : comment.editedAt
      : null,
  };
}

export interface TicketFeedbackResponseDto {
  id: string;
  ticketId: string;
  residentId: string | null;
  userId: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
}

export function toTicketFeedbackDto(feedback: TicketFeedback): TicketFeedbackResponseDto {
  return {
    id: feedback.id,
    ticketId: feedback.ticketId,
    residentId: feedback.residentId,
    userId: feedback.userId,
    rating: feedback.rating,
    comment: feedback.comment,
    submittedAt:
      feedback.submittedAt instanceof Date
        ? feedback.submittedAt.toISOString()
        : feedback.submittedAt,
  };
}

export interface TicketRelationResponseDto {
  id: string;
  sourceTicketId: string;
  targetTicketId: string;
  relationType: TicketRelationType;
  targetTicketNumber?: string;
  targetTicketTitle?: string;
  createdAt: string;
}

export function toTicketRelationDto(
  relation: TicketRelation,
  target?: { ticketNumber: string; title: string },
): TicketRelationResponseDto {
  return {
    id: relation.id,
    sourceTicketId: relation.sourceTicketId,
    targetTicketId: relation.targetTicketId,
    relationType: relation.relationType,
    targetTicketNumber: target?.ticketNumber,
    targetTicketTitle: target?.title,
    createdAt:
      relation.createdAt instanceof Date ? relation.createdAt.toISOString() : relation.createdAt,
  };
}

export interface TicketTimelineItemResponseDto {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorType?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export function toTicketTimelineItemDto(item: TicketTimelineItem): TicketTimelineItemResponseDto {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    actorId: item.actorId,
    actorName: item.actorName,
    actorType: item.actorType,
    metadata: item.metadata,
    occurredAt: item.occurredAt instanceof Date ? item.occurredAt.toISOString() : item.occurredAt,
  };
}

// =============================================================================
// TICKET SUMMARY & DETAIL DTOS
// =============================================================================

export interface TicketSummaryResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  ticketNumber: string;
  title: string;
  categoryId: string;
  categoryName?: string;
  subcategoryId: string | null;
  subcategoryName?: string;
  priority: TicketPriority;
  currentState: string;
  source: TicketSource;
  locationType: TicketLocationType;
  unitNumber?: string;
  buildingName?: string;
  reportedByName?: string;
  assignedTeamName?: string;
  assignedUserName?: string;
  slaStatus: SlaInstanceStatus | null;
  slaDueAt: string | null;
  slaBreachedAt: string | null;
  reopenCount: number;
  feedbackRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetailResponseDto extends TicketSummaryResponseDto {
  description: string;
  propertySectionId: string | null;
  propertySectionName?: string;
  buildingId: string | null;
  floorId: string | null;
  floorLabel?: string;
  unitId: string | null;
  locationDescription: string | null;
  reportedByResidentId: string | null;
  reportedByUserId: string | null;
  assignedTeamId: string | null;
  assignedUserId: string | null;
  workflowInstanceId: string;
  slaInstanceId: string | null;
  slaWarningAt: string | null;
  resolutionSummary: string | null;
  resolutionCode: string | null;
  resolvedById: string | null;
  resolvedByName?: string;
  resolvedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  duplicateOfTicketId: string | null;
  duplicateOfTicketNumber?: string;
  version: number;
  customFields?: Record<string, unknown>;
  comments?: TicketCommentResponseDto[];
  relations?: TicketRelationResponseDto[];
  feedback?: TicketFeedbackResponseDto | null;
  timeline?: TicketTimelineItemResponseDto[];
  allowedActions?: Array<{ action: string; label: string; toState: string }>;
}

export function toTicketDetailDto(
  ticket: Ticket,
  extras?: {
    categoryName?: string | null;
    subcategoryName?: string | null;
    unitNumber?: string | null;
    buildingName?: string | null;
    propertySectionName?: string | null;
    floorLabel?: string | null;
    reportedByName?: string | null;
    assignedTeamName?: string | null;
    assignedUserName?: string | null;
    resolvedByName?: string | null;
    duplicateOfTicketNumber?: string | null;
    feedbackRating?: number | null;
    customFields?: Record<string, unknown>;
    comments?: TicketCommentResponseDto[];
    relations?: TicketRelationResponseDto[];
    feedback?: TicketFeedbackResponseDto | null;
    timeline?: TicketTimelineItemResponseDto[];
    allowedActions?: Array<{ action: string; label: string; toState: string }>;
  },
): TicketDetailResponseDto {
  return {
    id: ticket.id,
    organizationId: ticket.organizationId,
    communityId: ticket.communityId,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    description: ticket.description,
    categoryId: ticket.categoryId,
    categoryName: extras?.categoryName ?? undefined,
    subcategoryId: ticket.subcategoryId,
    subcategoryName: extras?.subcategoryName ?? undefined,
    priority: ticket.priority,
    currentState: ticket.currentState,
    source: ticket.source,
    locationType: ticket.locationType,
    propertySectionId: ticket.propertySectionId,
    propertySectionName: extras?.propertySectionName ?? undefined,
    buildingId: ticket.buildingId,
    buildingName: extras?.buildingName ?? undefined,
    floorId: ticket.floorId,
    floorLabel: extras?.floorLabel ?? undefined,
    unitId: ticket.unitId,
    unitNumber: extras?.unitNumber ?? undefined,
    locationDescription: ticket.locationDescription,
    reportedByResidentId: ticket.reportedByResidentId,
    reportedByUserId: ticket.reportedByUserId,
    reportedByName: extras?.reportedByName ?? undefined,
    assignedTeamId: ticket.assignedTeamId,
    assignedTeamName: extras?.assignedTeamName ?? undefined,
    assignedUserId: ticket.assignedUserId,
    assignedUserName: extras?.assignedUserName ?? undefined,
    workflowInstanceId: ticket.workflowInstanceId,
    slaInstanceId: ticket.slaInstanceId,
    slaStatus: ticket.slaStatus,
    slaDueAt: ticket.slaDueAt
      ? ticket.slaDueAt instanceof Date
        ? ticket.slaDueAt.toISOString()
        : ticket.slaDueAt
      : null,
    slaWarningAt: ticket.slaWarningAt
      ? ticket.slaWarningAt instanceof Date
        ? ticket.slaWarningAt.toISOString()
        : ticket.slaWarningAt
      : null,
    slaBreachedAt: ticket.slaBreachedAt
      ? ticket.slaBreachedAt instanceof Date
        ? ticket.slaBreachedAt.toISOString()
        : ticket.slaBreachedAt
      : null,
    reopenCount: ticket.reopenCount,
    resolutionSummary: ticket.resolutionSummary,
    resolutionCode: ticket.resolutionCode,
    resolvedById: ticket.resolvedById,
    resolvedByName: extras?.resolvedByName ?? undefined,
    resolvedAt: ticket.resolvedAt
      ? ticket.resolvedAt instanceof Date
        ? ticket.resolvedAt.toISOString()
        : ticket.resolvedAt
      : null,
    closedAt: ticket.closedAt
      ? ticket.closedAt instanceof Date
        ? ticket.closedAt.toISOString()
        : ticket.closedAt
      : null,
    cancelledAt: ticket.cancelledAt
      ? ticket.cancelledAt instanceof Date
        ? ticket.cancelledAt.toISOString()
        : ticket.cancelledAt
      : null,
    cancellationReason: ticket.cancellationReason,
    duplicateOfTicketId: ticket.duplicateOfTicketId,
    duplicateOfTicketNumber: extras?.duplicateOfTicketNumber ?? undefined,
    version: ticket.version,
    feedbackRating: extras?.feedbackRating,
    customFields: extras?.customFields,
    comments: extras?.comments,
    relations: extras?.relations,
    feedback: extras?.feedback,
    timeline: extras?.timeline,
    allowedActions: extras?.allowedActions,
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
  };
}

export function toTicketSummaryDto(
  ticket: Ticket,
  extras?: {
    categoryName?: string;
    subcategoryName?: string;
    unitNumber?: string;
    buildingName?: string;
    reportedByName?: string;
    assignedTeamName?: string;
    assignedUserName?: string;
    feedbackRating?: number | null;
  },
): TicketSummaryResponseDto {
  return {
    id: ticket.id,
    organizationId: ticket.organizationId,
    communityId: ticket.communityId,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    categoryId: ticket.categoryId,
    categoryName: extras?.categoryName,
    subcategoryId: ticket.subcategoryId,
    subcategoryName: extras?.subcategoryName,
    priority: ticket.priority,
    currentState: ticket.currentState,
    source: ticket.source,
    locationType: ticket.locationType,
    unitNumber: extras?.unitNumber,
    buildingName: extras?.buildingName,
    reportedByName: extras?.reportedByName,
    assignedTeamName: extras?.assignedTeamName,
    assignedUserName: extras?.assignedUserName,
    slaStatus: ticket.slaStatus,
    slaDueAt: ticket.slaDueAt
      ? ticket.slaDueAt instanceof Date
        ? ticket.slaDueAt.toISOString()
        : ticket.slaDueAt
      : null,
    slaBreachedAt: ticket.slaBreachedAt
      ? ticket.slaBreachedAt instanceof Date
        ? ticket.slaBreachedAt.toISOString()
        : ticket.slaBreachedAt
      : null,
    reopenCount: ticket.reopenCount,
    feedbackRating: extras?.feedbackRating,
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
  };
}

export type HelpdeskKpiMetricsResponseDto = HelpdeskKpiMetrics;
