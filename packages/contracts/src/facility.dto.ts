import type {
  FacilityWorkCategory,
  WorkOrder,
  WorkOrderTask,
  FacilityChecklistTemplate,
  WorkOrderChecklistResult,
  WorkLog,
  WorkOrderEvidence,
  MaintenancePlan,
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderSource,
  WorkOrderLocationType,
  WorkOrderTaskStatus,
  FacilityChecklistTemplateStatus,
  ChecklistItemType,
  MaintenancePlanStatus,
  MaintenanceScheduleType,
  MaintenanceScheduleDefinition,
  MaintenanceMissedPolicy,
  WorkLogType,
  WorkEvidenceType,
  WorkOrderBlockerReason,
  CompletionReviewOutcome,
  TicketWorkOrderRelationType,
  SlaInstanceStatus,
  EntityStatus,
} from '@community-os/types';

// =============================================================================
// FACILITY WORK CATEGORY DTOS
// =============================================================================

export interface FacilityWorkCategoryResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  key: string;
  name: string;
  description: string | null;
  status: EntityStatus;
  defaultTeamId: string | null;
  defaultTeamName?: string;
  defaultPriority: WorkOrderPriority;
  defaultSlaPolicyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toFacilityWorkCategoryDto(
  cat: FacilityWorkCategory,
  extras?: { defaultTeamName?: string },
): FacilityWorkCategoryResponseDto {
  return {
    id: cat.id,
    organizationId: cat.organizationId,
    communityId: cat.communityId,
    key: cat.key,
    name: cat.name,
    description: cat.description,
    status: cat.status,
    defaultTeamId: cat.defaultTeamId,
    defaultTeamName: extras?.defaultTeamName,
    defaultPriority: cat.defaultPriority,
    defaultSlaPolicyId: cat.defaultSlaPolicyId,
    createdAt: cat.createdAt instanceof Date ? cat.createdAt.toISOString() : String(cat.createdAt),
    updatedAt: cat.updatedAt instanceof Date ? cat.updatedAt.toISOString() : String(cat.updatedAt),
  };
}

// =============================================================================
// WORK ORDER TASK DTOS
// =============================================================================

export interface WorkOrderTaskResponseDto {
  id: string;
  workOrderId: string;
  title: string;
  description: string | null;
  sequence: number;
  isRequired: boolean;
  status: WorkOrderTaskStatus;
  assignedUserId: string | null;
  assignedUserName?: string;
  completedById: string | null;
  completedByName?: string;
  completedAt: string | null;
  resultNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toWorkOrderTaskDto(
  task: WorkOrderTask,
  extras?: { assignedUserName?: string; completedByName?: string },
): WorkOrderTaskResponseDto {
  return {
    id: task.id,
    workOrderId: task.workOrderId,
    title: task.title,
    description: task.description,
    sequence: task.sequence,
    isRequired: task.isRequired,
    status: task.status,
    assignedUserId: task.assignedUserId,
    assignedUserName: extras?.assignedUserName,
    completedById: task.completedById,
    completedByName: extras?.completedByName,
    completedAt: task.completedAt
      ? task.completedAt instanceof Date
        ? task.completedAt.toISOString()
        : String(task.completedAt)
      : null,
    resultNotes: task.resultNotes,
    createdAt:
      task.createdAt instanceof Date ? task.createdAt.toISOString() : String(task.createdAt),
    updatedAt:
      task.updatedAt instanceof Date ? task.updatedAt.toISOString() : String(task.updatedAt),
  };
}

// =============================================================================
// CHECKLIST RESULT & TEMPLATE DTOS
// =============================================================================

export interface WorkOrderChecklistResultResponseDto {
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
  valueDecimal: number | null;
  valueDate: string | null;
  valueSelect: string | null;
  documentId: string | null;
  isPassed: boolean | null;
  failureComment: string | null;
  completedById: string | null;
  completedByName?: string;
  completedAt: string | null;
}

export function toWorkOrderChecklistResultDto(
  res: WorkOrderChecklistResult,
  extras?: { completedByName?: string },
): WorkOrderChecklistResultResponseDto {
  return {
    id: res.id,
    workOrderId: res.workOrderId,
    checklistTemplateId: res.checklistTemplateId,
    templateVersion: res.templateVersion,
    itemId: res.itemId,
    itemLabel: res.itemLabel,
    itemType: res.itemType,
    isRequired: res.isRequired,
    valueBoolean: res.valueBoolean,
    valueText: res.valueText,
    valueNumber: res.valueNumber,
    valueDecimal: res.valueDecimal ? Number(res.valueDecimal) : null,
    valueDate: res.valueDate
      ? res.valueDate instanceof Date
        ? res.valueDate.toISOString()
        : String(res.valueDate)
      : null,
    valueSelect: res.valueSelect,
    documentId: res.documentId,
    isPassed: res.isPassed,
    failureComment: res.failureComment,
    completedById: res.completedById,
    completedByName: extras?.completedByName,
    completedAt: res.completedAt
      ? res.completedAt instanceof Date
        ? res.completedAt.toISOString()
        : String(res.completedAt)
      : null,
  };
}

export interface FacilityChecklistTemplateResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  name: string;
  code: string;
  version: number;
  status: FacilityChecklistTemplateStatus;
  categoryId: string | null;
  categoryName?: string;
  items: Array<{
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
  }>;
  createdAt: string;
  updatedAt: string;
}

export function toFacilityChecklistTemplateDto(
  template: FacilityChecklistTemplate,
  extras?: { categoryName?: string },
): FacilityChecklistTemplateResponseDto {
  return {
    id: template.id,
    organizationId: template.organizationId,
    communityId: template.communityId,
    name: template.name,
    code: template.code,
    version: template.version,
    status: template.status,
    categoryId: template.categoryId,
    categoryName: extras?.categoryName,
    items: template.items as FacilityChecklistTemplateResponseDto['items'],
    createdAt:
      template.createdAt instanceof Date
        ? template.createdAt.toISOString()
        : String(template.createdAt),
    updatedAt:
      template.updatedAt instanceof Date
        ? template.updatedAt.toISOString()
        : String(template.updatedAt),
  };
}

// =============================================================================
// WORK LOG & EVIDENCE DTOS
// =============================================================================

export interface WorkLogResponseDto {
  id: string;
  workOrderId: string;
  userId: string;
  userName?: string;
  type: WorkLogType;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number;
  notes: string | null;
  isManual: boolean;
  source: string;
  createdAt: string;
}

export function toWorkLogDto(log: WorkLog, extras?: { userName?: string }): WorkLogResponseDto {
  return {
    id: log.id,
    workOrderId: log.workOrderId,
    userId: log.userId,
    userName: extras?.userName,
    type: log.type,
    startedAt: log.startedAt
      ? log.startedAt instanceof Date
        ? log.startedAt.toISOString()
        : String(log.startedAt)
      : null,
    endedAt: log.endedAt
      ? log.endedAt instanceof Date
        ? log.endedAt.toISOString()
        : String(log.endedAt)
      : null,
    durationMinutes: log.durationMinutes,
    notes: log.notes,
    isManual: log.isManual,
    source: log.source,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt),
  };
}

export interface WorkOrderEvidenceResponseDto {
  id: string;
  workOrderId: string;
  documentId: string;
  evidenceType: WorkEvidenceType;
  caption: string | null;
  uploadedById: string | null;
  uploadedByName?: string;
  createdAt: string;
}

export function toWorkOrderEvidenceDto(
  evidence: WorkOrderEvidence,
  extras?: { uploadedByName?: string },
): WorkOrderEvidenceResponseDto {
  return {
    id: evidence.id,
    workOrderId: evidence.workOrderId,
    documentId: evidence.documentId,
    evidenceType: evidence.evidenceType,
    caption: evidence.caption,
    uploadedById: evidence.uploadedById,
    uploadedByName: extras?.uploadedByName,
    createdAt:
      evidence.createdAt instanceof Date
        ? evidence.createdAt.toISOString()
        : String(evidence.createdAt),
  };
}

// =============================================================================
// WORK ORDER SUMMARY & DETAIL DTOS
// =============================================================================

export interface WorkOrderSummaryResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  workOrderNumber: string;
  title: string;
  workType: WorkOrderType;
  priority: WorkOrderPriority;
  categoryId: string | null;
  categoryName?: string;
  locationType: WorkOrderLocationType;
  unitNumber?: string;
  buildingName?: string;
  source: WorkOrderSource;
  currentState: string;
  scheduledStartAt: string | null;
  dueAt: string | null;
  primaryTeamId: string | null;
  primaryTeamName?: string;
  primaryAssigneeId: string | null;
  primaryAssigneeName?: string;
  isAccepted: boolean;
  isBlocked: boolean;
  isPaused: boolean;
  reworkCount: number;
  slaStatus: SlaInstanceStatus | null;
  slaDueAt: string | null;
  linkedTicketCount?: number;
  taskCount?: { total: number; completed: number };
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderDetailResponseDto extends WorkOrderSummaryResponseDto {
  description: string;
  propertySectionId: string | null;
  propertySectionName?: string;
  buildingId: string | null;
  floorId: string | null;
  floorLabel?: string;
  unitId: string | null;
  locationDescription: string | null;
  maintenancePlanId: string | null;
  maintenancePlanName?: string;
  planVersion: number | null;
  scheduledOccurrenceAt: string | null;
  workflowInstanceId: string;
  slaInstanceId: string | null;
  slaWarningAt: string | null;
  slaBreachedAt: string | null;
  scheduledEndAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  acceptedAt: string | null;
  blockedReason: string | null;
  blockedCategory: WorkOrderBlockerReason | null;
  blockedAt: string | null;
  pausedAt: string | null;
  completionSummary: string | null;
  resolutionCode: string | null;
  verifiedById: string | null;
  verifiedByName?: string;
  verifiedAt: string | null;
  cancelledById: string | null;
  cancelledByName?: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  version: number;
  createdById: string | null;
  createdByName?: string;
  tasks?: WorkOrderTaskResponseDto[];
  checklistResults?: WorkOrderChecklistResultResponseDto[];
  workLogs?: WorkLogResponseDto[];
  evidence?: WorkOrderEvidenceResponseDto[];
  completionAttempts?: Array<{
    id: string;
    attemptNumber: number;
    submittedById: string;
    submittedByName?: string;
    submittedAt: string;
    summary: string;
    reviewOutcome: CompletionReviewOutcome;
    reviewerId: string | null;
    reviewerName?: string;
    reviewedAt: string | null;
    reviewNotes: string | null;
  }>;
  linkedTickets?: Array<{
    id: string;
    ticketId: string;
    ticketNumber: string;
    ticketTitle: string;
    relationshipType: TicketWorkOrderRelationType;
  }>;
  allowedActions?: Array<{ action: string; label: string; toState: string }>;
  customFields?: Record<string, unknown>;
  activeTimer?: {
    id: string;
    startedAt: string;
    userId: string;
  } | null;
}

export function toWorkOrderSummaryDto(
  wo: WorkOrder,
  extras?: {
    categoryName?: string | null;
    unitNumber?: string | null;
    buildingName?: string | null;
    primaryTeamName?: string | null;
    primaryAssigneeName?: string | null;
    linkedTicketCount?: number;
    taskCount?: { total: number; completed: number };
  },
): WorkOrderSummaryResponseDto {
  return {
    id: wo.id,
    organizationId: wo.organizationId,
    communityId: wo.communityId,
    workOrderNumber: wo.workOrderNumber,
    title: wo.title,
    workType: wo.workType,
    priority: wo.priority,
    categoryId: wo.categoryId,
    categoryName: extras?.categoryName ?? undefined,
    locationType: wo.locationType,
    unitNumber: extras?.unitNumber ?? undefined,
    buildingName: extras?.buildingName ?? undefined,
    source: wo.source,
    currentState: wo.currentState,
    scheduledStartAt: wo.scheduledStartAt
      ? wo.scheduledStartAt instanceof Date
        ? wo.scheduledStartAt.toISOString()
        : String(wo.scheduledStartAt)
      : null,
    dueAt: wo.dueAt ? (wo.dueAt instanceof Date ? wo.dueAt.toISOString() : String(wo.dueAt)) : null,
    primaryTeamId: wo.primaryTeamId,
    primaryTeamName: extras?.primaryTeamName ?? undefined,
    primaryAssigneeId: wo.primaryAssigneeId,
    primaryAssigneeName: extras?.primaryAssigneeName ?? undefined,
    isAccepted: wo.isAccepted,
    isBlocked: wo.isBlocked,
    isPaused: wo.isPaused,
    reworkCount: wo.reworkCount,
    slaStatus: wo.slaStatus,
    slaDueAt: wo.slaDueAt
      ? wo.slaDueAt instanceof Date
        ? wo.slaDueAt.toISOString()
        : String(wo.slaDueAt)
      : null,
    linkedTicketCount: extras?.linkedTicketCount ?? 0,
    taskCount: extras?.taskCount,
    createdAt: wo.createdAt instanceof Date ? wo.createdAt.toISOString() : String(wo.createdAt),
    updatedAt: wo.updatedAt instanceof Date ? wo.updatedAt.toISOString() : String(wo.updatedAt),
  };
}

export function toWorkOrderDetailDto(
  wo: WorkOrder,
  extras?: {
    categoryName?: string | null;
    unitNumber?: string | null;
    buildingName?: string | null;
    propertySectionName?: string | null;
    floorLabel?: string | null;
    primaryTeamName?: string | null;
    primaryAssigneeName?: string | null;
    maintenancePlanName?: string | null;
    verifiedByName?: string | null;
    cancelledByName?: string | null;
    createdByName?: string | null;
    tasks?: WorkOrderTaskResponseDto[];
    checklistResults?: WorkOrderChecklistResultResponseDto[];
    workLogs?: WorkLogResponseDto[];
    evidence?: WorkOrderEvidenceResponseDto[];
    completionAttempts?: Array<{
      id: string;
      attemptNumber: number;
      submittedById: string;
      submittedByName?: string;
      submittedAt: string;
      summary: string;
      reviewOutcome: CompletionReviewOutcome;
      reviewerId: string | null;
      reviewerName?: string;
      reviewedAt: string | null;
      reviewNotes: string | null;
    }>;
    linkedTickets?: Array<{
      id: string;
      ticketId: string;
      ticketNumber: string;
      ticketTitle: string;
      relationshipType: TicketWorkOrderRelationType;
    }>;
    allowedActions?: Array<{ action: string; label: string; toState: string }>;
    customFields?: Record<string, unknown>;
    activeTimer?: {
      id: string;
      startedAt: string;
      userId: string;
    } | null;
  },
): WorkOrderDetailResponseDto {
  const summary = toWorkOrderSummaryDto(wo, extras);
  return {
    ...summary,
    description: wo.description,
    propertySectionId: wo.propertySectionId,
    propertySectionName: extras?.propertySectionName ?? undefined,
    buildingId: wo.buildingId,
    floorId: wo.floorId,
    floorLabel: extras?.floorLabel ?? undefined,
    unitId: wo.unitId,
    locationDescription: wo.locationDescription,
    maintenancePlanId: wo.maintenancePlanId,
    maintenancePlanName: extras?.maintenancePlanName ?? undefined,
    planVersion: wo.planVersion,
    scheduledOccurrenceAt: wo.scheduledOccurrenceAt
      ? wo.scheduledOccurrenceAt instanceof Date
        ? wo.scheduledOccurrenceAt.toISOString()
        : String(wo.scheduledOccurrenceAt)
      : null,
    workflowInstanceId: wo.workflowInstanceId,
    slaInstanceId: wo.slaInstanceId,
    slaWarningAt: wo.slaWarningAt
      ? wo.slaWarningAt instanceof Date
        ? wo.slaWarningAt.toISOString()
        : String(wo.slaWarningAt)
      : null,
    slaBreachedAt: wo.slaBreachedAt
      ? wo.slaBreachedAt instanceof Date
        ? wo.slaBreachedAt.toISOString()
        : String(wo.slaBreachedAt)
      : null,
    scheduledEndAt: wo.scheduledEndAt
      ? wo.scheduledEndAt instanceof Date
        ? wo.scheduledEndAt.toISOString()
        : String(wo.scheduledEndAt)
      : null,
    actualStartAt: wo.actualStartAt
      ? wo.actualStartAt instanceof Date
        ? wo.actualStartAt.toISOString()
        : String(wo.actualStartAt)
      : null,
    actualEndAt: wo.actualEndAt
      ? wo.actualEndAt instanceof Date
        ? wo.actualEndAt.toISOString()
        : String(wo.actualEndAt)
      : null,
    acceptedAt: wo.acceptedAt
      ? wo.acceptedAt instanceof Date
        ? wo.acceptedAt.toISOString()
        : String(wo.acceptedAt)
      : null,
    blockedReason: wo.blockedReason,
    blockedCategory: wo.blockedCategory,
    blockedAt: wo.blockedAt
      ? wo.blockedAt instanceof Date
        ? wo.blockedAt.toISOString()
        : String(wo.blockedAt)
      : null,
    pausedAt: wo.pausedAt
      ? wo.pausedAt instanceof Date
        ? wo.pausedAt.toISOString()
        : String(wo.pausedAt)
      : null,
    completionSummary: wo.completionSummary,
    resolutionCode: wo.resolutionCode,
    verifiedById: wo.verifiedById,
    verifiedByName: extras?.verifiedByName ?? undefined,
    verifiedAt: wo.verifiedAt
      ? wo.verifiedAt instanceof Date
        ? wo.verifiedAt.toISOString()
        : String(wo.verifiedAt)
      : null,
    cancelledById: wo.cancelledById,
    cancelledByName: extras?.cancelledByName ?? undefined,
    cancelledAt: wo.cancelledAt
      ? wo.cancelledAt instanceof Date
        ? wo.cancelledAt.toISOString()
        : String(wo.cancelledAt)
      : null,
    cancellationReason: wo.cancellationReason,
    version: wo.version,
    createdById: wo.createdById,
    createdByName: extras?.createdByName ?? undefined,
    tasks: extras?.tasks ?? [],
    checklistResults: extras?.checklistResults ?? [],
    workLogs: extras?.workLogs ?? [],
    evidence: extras?.evidence ?? [],
    completionAttempts: extras?.completionAttempts ?? [],
    linkedTickets: extras?.linkedTickets ?? [],
    allowedActions: extras?.allowedActions ?? [],
    customFields: extras?.customFields,
    activeTimer: extras?.activeTimer ?? null,
  };
}

// =============================================================================
// MAINTENANCE PLAN DTOS
// =============================================================================

export interface MaintenancePlanResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  name: string;
  code: string;
  description: string | null;
  status: MaintenancePlanStatus;
  workCategoryId: string | null;
  workCategoryName?: string;
  workType: WorkOrderType;
  scheduleType: MaintenanceScheduleType;
  scheduleDefinition: MaintenanceScheduleDefinition;
  timezone: string;
  businessCalendarId: string | null;
  defaultPriority: WorkOrderPriority;
  defaultTeamId: string | null;
  defaultTeamName?: string;
  workflowDefinitionId: string | null;
  checklistTemplateId: string | null;
  checklistTemplateName?: string;
  estimatedDurationMinutes: number | null;
  generationPolicy: MaintenanceMissedPolicy;
  leadTimeDays: number;
  targetLocationType: WorkOrderLocationType;
  targetSectionId: string | null;
  targetBuildingId: string | null;
  targetBuildingName?: string;
  targetFloorId: string | null;
  targetUnitId: string | null;
  targetUnitNumber?: string;
  targetLocationDescription: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function toMaintenancePlanDto(
  plan: MaintenancePlan,
  extras?: {
    workCategoryName?: string | null;
    defaultTeamName?: string | null;
    checklistTemplateName?: string | null;
    targetBuildingName?: string | null;
    targetUnitNumber?: string | null;
  },
): MaintenancePlanResponseDto {
  return {
    id: plan.id,
    organizationId: plan.organizationId,
    communityId: plan.communityId,
    name: plan.name,
    code: plan.code,
    description: plan.description,
    status: plan.status,
    workCategoryId: plan.workCategoryId,
    workCategoryName: extras?.workCategoryName ?? undefined,
    workType: plan.workType,
    scheduleType: plan.scheduleType,
    scheduleDefinition: plan.scheduleDefinition,
    timezone: plan.timezone,
    businessCalendarId: plan.businessCalendarId,
    defaultPriority: plan.defaultPriority,
    defaultTeamId: plan.defaultTeamId,
    defaultTeamName: extras?.defaultTeamName ?? undefined,
    workflowDefinitionId: plan.workflowDefinitionId,
    checklistTemplateId: plan.checklistTemplateId,
    checklistTemplateName: extras?.checklistTemplateName ?? undefined,
    estimatedDurationMinutes: plan.estimatedDurationMinutes,
    generationPolicy: plan.generationPolicy,
    leadTimeDays: plan.leadTimeDays,
    targetLocationType: plan.targetLocationType,
    targetSectionId: plan.targetSectionId,
    targetBuildingId: plan.targetBuildingId,
    targetBuildingName: extras?.targetBuildingName ?? undefined,
    targetFloorId: plan.targetFloorId,
    targetUnitId: plan.targetUnitId,
    targetUnitNumber: extras?.targetUnitNumber ?? undefined,
    targetLocationDescription: plan.targetLocationDescription,
    nextRunAt: plan.nextRunAt
      ? plan.nextRunAt instanceof Date
        ? plan.nextRunAt.toISOString()
        : String(plan.nextRunAt)
      : null,
    lastRunAt: plan.lastRunAt
      ? plan.lastRunAt instanceof Date
        ? plan.lastRunAt.toISOString()
        : String(plan.lastRunAt)
      : null,
    version: plan.version,
    createdAt:
      plan.createdAt instanceof Date ? plan.createdAt.toISOString() : String(plan.createdAt),
    updatedAt:
      plan.updatedAt instanceof Date ? plan.updatedAt.toISOString() : String(plan.updatedAt),
  };
}
