import type { SlaInstanceStatus } from './workflow.js';
import type { EntityStatus } from './domain.js';

// =============================================================================
// PHASE 9: ENTERPRISE FACILITY MANAGEMENT & WORK EXECUTION ENUMS
// =============================================================================

export type WorkOrderType =
  'CORRECTIVE' | 'PREVENTIVE' | 'INSPECTION' | 'ROUTINE' | 'EMERGENCY' | 'OTHER';

export type WorkOrderSource =
  'HELPDESK_TICKET' | 'PREVENTIVE_PLAN' | 'MANUAL' | 'INSPECTION' | 'SYSTEM';

export type WorkOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';

export type WorkOrderLocationType =
  'COMMUNITY' | 'SECTION' | 'BUILDING' | 'FLOOR' | 'UNIT' | 'COMMON_AREA' | 'OTHER';

export type TicketWorkOrderRelationType = 'GENERATED_FROM' | 'RELATED_WORK' | 'FOLLOW_UP';

export type WorkOrderTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'BLOCKED';

export type FacilityChecklistTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ChecklistItemType =
  'BOOLEAN' | 'PASS_FAIL' | 'TEXT' | 'NUMBER' | 'DECIMAL' | 'DATE' | 'SELECT' | 'PHOTO_REQUIRED';

export type MaintenancePlanStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export type MaintenanceScheduleType =
  'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM_RRULE';

export type MaintenanceMissedPolicy = 'SKIP_MISSED' | 'GENERATE_LATEST' | 'GENERATE_ALL_WITH_LIMIT';

export type WorkLogType = 'WORK' | 'TRAVEL' | 'WAITING' | 'INSPECTION';

export type WorkEvidenceType =
  | 'WORK_ORDER_ATTACHMENT'
  | 'BEFORE_PHOTO'
  | 'AFTER_PHOTO'
  | 'COMPLETION_PROOF'
  | 'CHECKLIST_EVIDENCE';

export type WorkOrderBlockerReason =
  | 'PART_REQUIRED'
  | 'VENDOR_REQUIRED'
  | 'ACCESS_REQUIRED'
  | 'RESIDENT_RESPONSE'
  | 'SAFETY'
  | 'WEATHER'
  | 'OTHER';

export type CompletionReviewOutcome = 'APPROVED' | 'REWORK_REQUESTED';

// =============================================================================
// DOMAIN INTERFACES
// =============================================================================

export interface FacilityWorkCategory {
  id: string;
  organizationId: string;
  communityId: string | null;
  key: string;
  name: string;
  description: string | null;
  status: EntityStatus;
  defaultTeamId: string | null;
  defaultPriority: WorkOrderPriority;
  defaultSlaPolicyId: string | null;
  createdById: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WorkOrder {
  id: string;
  organizationId: string;
  communityId: string;
  workOrderNumber: string;
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
  source: WorkOrderSource;
  maintenancePlanId: string | null;
  planVersion: number | null;
  scheduledOccurrenceAt: Date | string | null;
  workflowInstanceId: string;
  slaInstanceId: string | null;
  slaStatus: SlaInstanceStatus | null;
  slaDueAt: Date | string | null;
  slaWarningAt: Date | string | null;
  slaBreachedAt: Date | string | null;
  currentState: string;
  scheduledStartAt: Date | string | null;
  scheduledEndAt: Date | string | null;
  actualStartAt: Date | string | null;
  actualEndAt: Date | string | null;
  dueAt: Date | string | null;
  primaryTeamId: string | null;
  primaryAssigneeId: string | null;
  isAccepted: boolean;
  acceptedAt: Date | string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedCategory: WorkOrderBlockerReason | null;
  blockedAt: Date | string | null;
  isPaused: boolean;
  pausedAt: Date | string | null;
  reworkCount: number;
  completionSummary: string | null;
  resolutionCode: string | null;
  verifiedById: string | null;
  verifiedAt: Date | string | null;
  cancelledById: string | null;
  cancelledAt: Date | string | null;
  cancellationReason: string | null;
  version: number;
  createdById: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TicketWorkOrderLink {
  id: string;
  ticketId: string;
  workOrderId: string;
  relationshipType: TicketWorkOrderRelationType;
  createdById: string | null;
  createdAt: Date | string;
}

export interface WorkOrderTask {
  id: string;
  workOrderId: string;
  title: string;
  description: string | null;
  sequence: number;
  isRequired: boolean;
  status: WorkOrderTaskStatus;
  assignedUserId: string | null;
  completedById: string | null;
  completedAt: Date | string | null;
  resultNotes: string | null;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FacilityChecklistItem {
  id: string;
  label: string;
  description?: string;
  itemType: ChecklistItemType;
  isRequired: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  unitLabel?: string;
  failureRequiresComment?: boolean;
  failureRequiresPhoto?: boolean;
}

export interface FacilityChecklistTemplate {
  id: string;
  organizationId: string;
  communityId: string | null;
  name: string;
  code: string;
  version: number;
  status: FacilityChecklistTemplateStatus;
  categoryId: string | null;
  items: FacilityChecklistItem[];
  createdById: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WorkOrderChecklistResult {
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
  valueDecimal: number | string | null;
  valueDate: Date | string | null;
  valueSelect: string | null;
  documentId: string | null;
  isPassed: boolean | null;
  failureComment: string | null;
  completedById: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WorkLog {
  id: string;
  workOrderId: string;
  userId: string;
  type: WorkLogType;
  startedAt: Date | string | null;
  endedAt: Date | string | null;
  durationMinutes: number;
  notes: string | null;
  isManual: boolean;
  source: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WorkOrderAssignmentHistory {
  id: string;
  workOrderId: string;
  fromTeamId: string | null;
  toTeamId: string | null;
  fromUserId: string | null;
  toUserId: string | null;
  assignedById: string;
  reason: string | null;
  assignedAt: Date | string;
}

export interface WorkOrderEvidence {
  id: string;
  workOrderId: string;
  documentId: string;
  evidenceType: WorkEvidenceType;
  caption: string | null;
  uploadedById: string | null;
  createdAt: Date | string;
}

export interface WorkCompletionAttempt {
  id: string;
  workOrderId: string;
  attemptNumber: number;
  submittedById: string;
  submittedAt: Date | string;
  summary: string;
  reviewOutcome: CompletionReviewOutcome;
  reviewerId: string | null;
  reviewedAt: Date | string | null;
  reviewNotes: string | null;
}

export interface MaintenanceScheduleDefinition {
  dayOfWeek?: number; // 0 (Sun) - 6 (Sat)
  dayOfMonth?: number; // 1 - 31
  monthOfYear?: number; // 1 - 12
  timeOfDay?: string; // "HH:MM" in 24h format, e.g. "09:00"
  rrule?: string; // iCal RRULE string
  interval?: number; // e.g. every 2 weeks
}

export interface MaintenancePlan {
  id: string;
  organizationId: string;
  communityId: string;
  name: string;
  code: string;
  description: string | null;
  status: MaintenancePlanStatus;
  workCategoryId: string | null;
  workType: WorkOrderType;
  scheduleType: MaintenanceScheduleType;
  scheduleDefinition: MaintenanceScheduleDefinition;
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
  nextRunAt: Date | string | null;
  lastRunAt: Date | string | null;
  version: number;
  createdById: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MaintenancePlanOccurrence {
  id: string;
  maintenancePlanId: string;
  occurrenceKey: string;
  scheduledAt: Date | string;
  workOrderId: string | null;
  status: string;
  generatedAt: Date | string;
}

export interface FacilityKpiMetrics {
  totalOpen: number;
  unassigned: number;
  inProgress: number;
  blocked: number;
  waitingReview: number;
  dueToday: number;
  overdue: number;
  completedToday: number;
  preventiveCompliancePercentage: number;
  activeTimersCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface WorkOrderFilterParams {
  organizationId?: string;
  communityId?: string;
  currentState?: string | string[];
  workType?: WorkOrderType | WorkOrderType[];
  priority?: WorkOrderPriority | WorkOrderPriority[];
  categoryId?: string;
  primaryTeamId?: string;
  primaryAssigneeId?: string;
  buildingId?: string;
  unitId?: string;
  source?: WorkOrderSource;
  maintenancePlanId?: string;
  isBlocked?: boolean;
  isOverdue?: boolean;
  dueFrom?: Date | string;
  dueTo?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?:
    'createdAt' | 'updatedAt' | 'priority' | 'dueAt' | 'scheduledStartAt' | 'workOrderNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface MaintenancePlanFilterParams {
  organizationId?: string;
  communityId?: string;
  status?: MaintenancePlanStatus | MaintenancePlanStatus[];
  workCategoryId?: string;
  defaultTeamId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
