import type { SlaInstanceStatus } from './workflow.js';

// =============================================================================
// PHASE 8: ENTERPRISE HELPDESK & COMPLAINT DOMAIN TYPES
// =============================================================================

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';

export type TicketSource =
  'RESIDENT_APP' | 'ADMIN_WEB' | 'STAFF_APP' | 'PHONE_DESK' | 'EMAIL' | 'SYSTEM' | 'IMPORT';

export type TicketLocationType =
  'UNIT' | 'FLOOR' | 'BUILDING' | 'SECTION' | 'COMMON_AREA' | 'COMMUNITY' | 'OTHER';

export type TicketCommentType = 'PUBLIC_REPLY' | 'INTERNAL_NOTE' | 'SYSTEM_NOTE';

export type TicketCategoryStatus = 'ACTIVE' | 'ARCHIVED';

export type HelpdeskTeamStatus = 'ACTIVE' | 'ARCHIVED';

export type TicketRelationType = 'DUPLICATE_OF' | 'RELATED_TO' | 'CHILD_OF';

export type TicketResolutionCode =
  | 'FIXED'
  | 'NO_FAULT_FOUND'
  | 'DUPLICATE'
  | 'USER_GUIDANCE'
  | 'VENDOR_ACTION_COMPLETED'
  | 'CANNOT_REPRODUCE'
  | 'NOT_IN_SCOPE';

export interface TicketCategory {
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
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HelpdeskTeam {
  id: string;
  organizationId: string;
  communityId: string | null;
  key: string;
  name: string;
  description: string | null;
  status: HelpdeskTeamStatus;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HelpdeskTeamMember {
  id: string;
  teamId: string;
  userId: string;
  roleInTeam: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketAssignmentHistory {
  id: string;
  ticketId: string;
  fromTeamId: string | null;
  toTeamId: string | null;
  fromUserId: string | null;
  toUserId: string | null;
  assignedById: string;
  reason: string | null;
  assignedAt: Date;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorUserId: string | null;
  authorResidentId: string | null;
  type: TicketCommentType;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
}

export interface TicketFeedback {
  id: string;
  ticketId: string;
  residentId: string | null;
  userId: string;
  rating: number;
  comment: string | null;
  submittedAt: Date;
}

export interface TicketRelation {
  id: string;
  sourceTicketId: string;
  targetTicketId: string;
  relationType: TicketRelationType;
  createdById: string | null;
  createdAt: Date;
}

export interface Ticket {
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
}

export interface TicketTimelineItem {
  id: string;
  type:
    | 'CREATION'
    | 'WORKFLOW_TRANSITION'
    | 'ASSIGNMENT'
    | 'COMMENT'
    | 'INTERNAL_NOTE'
    | 'SLA_MILESTONE'
    | 'RESOLUTION'
    | 'REOPEN'
    | 'FEEDBACK';
  title: string;
  description?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  actorType?: string;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
}

export interface HelpdeskKpiMetrics {
  totalTickets: number;
  openTickets: number;
  unassignedTickets: number;
  slaAtRiskTickets: number;
  slaBreachedTickets: number;
  resolvedTodayCount: number;
  averageResolutionMinutes: number;
  averageFirstResponseMinutes: number;
  reopenRatePercent: number;
  csatAverageRating: number;
  csatResponseCount: number;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
}
