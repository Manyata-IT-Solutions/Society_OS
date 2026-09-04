import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowTransitionHistory,
  AllowedWorkflowAction,
  WorkflowStateDescriptor,
  WorkflowTransitionDescriptor,
  RuleDefinition,
  RuleEvaluationResult,
  ApprovalPolicyDefinition,
  ApprovalStepDefinition,
  ApprovalInstance,
  ApprovalStepInstance,
  ApprovalDecision,
  BusinessCalendar,
  SlaPolicyDefinition,
  SlaInstance,
  ConditionNode,
  BusinessHoursInterval,
  BusinessCalendarException,
} from '@community-os/types';

// =============================================================================
// WORKFLOW DTOS & MAPPERS
// =============================================================================

export interface WorkflowDefinitionResponseDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  scopeType: string;
  scopeId: string | null;
  organizationId: string | null;
  communityId: string | null;
  status: string;
  entityType: string;
  initialStateKey: string;
  states: WorkflowStateDescriptor[];
  transitions: WorkflowTransitionDescriptor[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toWorkflowDefinitionDto(def: WorkflowDefinition): WorkflowDefinitionResponseDto {
  return {
    id: def.id,
    key: def.key,
    name: def.name,
    description: def.description ?? null,
    version: def.version,
    scopeType: def.scopeType,
    scopeId: def.scopeId ?? null,
    organizationId: def.organizationId ?? null,
    communityId: def.communityId ?? null,
    status: def.status,
    entityType: def.entityType,
    initialStateKey: def.initialStateKey,
    states: def.states,
    transitions: def.transitions,
    publishedAt: def.publishedAt ? def.publishedAt.toISOString() : null,
    createdAt: def.createdAt.toISOString(),
    updatedAt: def.updatedAt.toISOString(),
  };
}

export interface WorkflowInstanceResponseDto {
  id: string;
  workflowDefinitionId: string;
  workflowDefinitionKey: string;
  workflowVersion: number;
  scopeType: string;
  organizationId: string | null;
  communityId: string | null;
  resourceType: string;
  resourceId: string;
  currentState: string;
  status: string;
  contextSnapshot: Record<string, unknown>;
  version: number;
  startedAt: string;
  completedAt: string | null;
  lastTransitionAt: string;
  createdAt: string;
  updatedAt: string;
}

export function toWorkflowInstanceDto(inst: WorkflowInstance): WorkflowInstanceResponseDto {
  return {
    id: inst.id,
    workflowDefinitionId: inst.workflowDefinitionId,
    workflowDefinitionKey: inst.workflowDefinitionKey,
    workflowVersion: inst.workflowVersion,
    scopeType: inst.scopeType,
    organizationId: inst.organizationId ?? null,
    communityId: inst.communityId ?? null,
    resourceType: inst.resourceType,
    resourceId: inst.resourceId,
    currentState: inst.currentState,
    status: inst.status,
    contextSnapshot: inst.contextSnapshot,
    version: inst.version,
    startedAt: inst.startedAt.toISOString(),
    completedAt: inst.completedAt ? inst.completedAt.toISOString() : null,
    lastTransitionAt: inst.lastTransitionAt.toISOString(),
    createdAt: inst.createdAt.toISOString(),
    updatedAt: inst.updatedAt.toISOString(),
  };
}

export interface WorkflowTransitionHistoryResponseDto {
  id: string;
  workflowInstanceId: string;
  fromState: string;
  toState: string;
  action: string;
  actorId: string | null;
  actorType: string;
  reason: string | null;
  comment: string | null;
  requestId: string | null;
  correlationId: string | null;
  ruleEvaluationSummary: Record<string, unknown> | null;
  approvalInstanceId: string | null;
  occurredAt: string;
  createdAt: string;
}

export function toWorkflowTransitionHistoryDto(
  hist: WorkflowTransitionHistory,
): WorkflowTransitionHistoryResponseDto {
  return {
    id: hist.id,
    workflowInstanceId: hist.workflowInstanceId,
    fromState: hist.fromState,
    toState: hist.toState,
    action: hist.action,
    actorId: hist.actorId ?? null,
    actorType: hist.actorType,
    reason: hist.reason ?? null,
    comment: hist.comment ?? null,
    requestId: hist.requestId ?? null,
    correlationId: hist.correlationId ?? null,
    ruleEvaluationSummary: hist.ruleEvaluationSummary ?? null,
    approvalInstanceId: hist.approvalInstanceId ?? null,
    occurredAt: hist.occurredAt.toISOString(),
    createdAt: hist.createdAt.toISOString(),
  };
}

export interface AllowedWorkflowActionDto {
  action: string;
  label: string;
  targetState: string;
  requiresReason: boolean;
  requiresComment: boolean;
  requiresApproval: boolean;
}

export function toAllowedWorkflowActionDto(act: AllowedWorkflowAction): AllowedWorkflowActionDto {
  return {
    action: act.action,
    label: act.label,
    targetState: act.targetState,
    requiresReason: act.requiresReason,
    requiresComment: act.requiresComment,
    requiresApproval: act.requiresApproval,
  };
}

// =============================================================================
// RULES DTOS & MAPPERS
// =============================================================================

export interface RuleDefinitionResponseDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  scopeType: string;
  scopeId: string | null;
  organizationId: string | null;
  communityId: string | null;
  status: string;
  resourceType: string;
  inputSchema: Record<string, unknown>;
  conditionTree: ConditionNode;
  outputEffect: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toRuleDefinitionDto(rule: RuleDefinition): RuleDefinitionResponseDto {
  return {
    id: rule.id,
    key: rule.key,
    name: rule.name,
    description: rule.description ?? null,
    version: rule.version,
    scopeType: rule.scopeType,
    scopeId: rule.scopeId ?? null,
    organizationId: rule.organizationId ?? null,
    communityId: rule.communityId ?? null,
    status: rule.status,
    resourceType: rule.resourceType,
    inputSchema: rule.inputSchema,
    conditionTree: rule.conditionTree,
    outputEffect: rule.outputEffect ?? null,
    publishedAt: rule.publishedAt ? rule.publishedAt.toISOString() : null,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

export interface RuleSimulationResultDto {
  ruleKey: string;
  version: number;
  passed: boolean;
  outputEffect: Record<string, unknown> | null;
  trace: Record<string, unknown>;
  evaluatedAt: string;
}

export function toRuleSimulationResultDto(res: RuleEvaluationResult): RuleSimulationResultDto {
  return {
    ruleKey: res.ruleKey,
    version: res.version,
    passed: res.passed,
    outputEffect: res.outputEffect ?? null,
    trace: res.trace as unknown as Record<string, unknown>,
    evaluatedAt: res.evaluatedAt.toISOString(),
  };
}

// =============================================================================
// APPROVAL DTOS & MAPPERS
// =============================================================================

export interface ApprovalPolicyResponseDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  scopeType: string;
  scopeId: string | null;
  organizationId: string | null;
  communityId: string | null;
  status: string;
  steps: ApprovalStepDefinition[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toApprovalPolicyDto(policy: ApprovalPolicyDefinition): ApprovalPolicyResponseDto {
  return {
    id: policy.id,
    key: policy.key,
    name: policy.name,
    description: policy.description ?? null,
    version: policy.version,
    scopeType: policy.scopeType,
    scopeId: policy.scopeId ?? null,
    organizationId: policy.organizationId ?? null,
    communityId: policy.communityId ?? null,
    status: policy.status,
    steps: policy.steps,
    publishedAt: policy.publishedAt ? policy.publishedAt.toISOString() : null,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

export interface ApprovalInstanceResponseDto {
  id: string;
  workflowInstanceId: string | null;
  policyDefinitionId: string;
  policyKey: string;
  policyVersion: number;
  organizationId: string | null;
  communityId: string | null;
  resourceType: string;
  resourceId: string;
  requesterId: string | null;
  status: string;
  currentStepOrder: number;
  startedAt: string;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function toApprovalInstanceDto(inst: ApprovalInstance): ApprovalInstanceResponseDto {
  return {
    id: inst.id,
    workflowInstanceId: inst.workflowInstanceId ?? null,
    policyDefinitionId: inst.policyDefinitionId,
    policyKey: inst.policyKey,
    policyVersion: inst.policyVersion,
    organizationId: inst.organizationId ?? null,
    communityId: inst.communityId ?? null,
    resourceType: inst.resourceType,
    resourceId: inst.resourceId,
    requesterId: inst.requesterId ?? null,
    status: inst.status,
    currentStepOrder: inst.currentStepOrder,
    startedAt: inst.startedAt.toISOString(),
    completedAt: inst.completedAt ? inst.completedAt.toISOString() : null,
    version: inst.version,
    createdAt: inst.createdAt.toISOString(),
    updatedAt: inst.updatedAt.toISOString(),
  };
}

export interface ApprovalStepInstanceResponseDto {
  id: string;
  approvalInstanceId: string;
  stepOrder: number;
  name: string;
  approverType: string;
  approverValue: string;
  quorumMode: string;
  minCount: number;
  status: string;
  eligibleApproverIds: string[];
  requiredCount: number | null;
  approvedCount: number;
  rejectedCount: number;
  openedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toApprovalStepInstanceDto(
  step: ApprovalStepInstance,
): ApprovalStepInstanceResponseDto {
  return {
    id: step.id,
    approvalInstanceId: step.approvalInstanceId,
    stepOrder: step.stepOrder,
    name: step.name,
    approverType: step.approverType,
    approverValue: step.approverValue,
    quorumMode: step.quorumMode,
    minCount: step.minCount,
    status: step.status,
    eligibleApproverIds: step.eligibleApproverIds,
    requiredCount: step.requiredCount ?? null,
    approvedCount: step.approvedCount,
    rejectedCount: step.rejectedCount,
    openedAt: step.openedAt.toISOString(),
    completedAt: step.completedAt ? step.completedAt.toISOString() : null,
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString(),
  };
}

export interface ApprovalDecisionResponseDto {
  id: string;
  approvalInstanceId: string;
  stepInstanceId: string;
  actorId: string;
  actorType: string;
  decision: string;
  comment: string | null;
  requestId: string | null;
  correlationId: string | null;
  occurredAt: string;
  createdAt: string;
}

export function toApprovalDecisionDto(dec: ApprovalDecision): ApprovalDecisionResponseDto {
  return {
    id: dec.id,
    approvalInstanceId: dec.approvalInstanceId,
    stepInstanceId: dec.stepInstanceId,
    actorId: dec.actorId,
    actorType: dec.actorType,
    decision: dec.decision,
    comment: dec.comment ?? null,
    requestId: dec.requestId ?? null,
    correlationId: dec.correlationId ?? null,
    occurredAt: dec.occurredAt.toISOString(),
    createdAt: dec.createdAt.toISOString(),
  };
}

export interface MyApprovalInboxItemDto {
  approvalInstanceId: string;
  stepInstanceId: string;
  policyKey: string;
  stepName: string;
  stepOrder: number;
  resourceType: string;
  resourceId: string;
  requesterId: string | null;
  organizationId: string | null;
  communityId: string | null;
  status: string;
  openedAt: string;
  dueAt: string | null;
}

// =============================================================================
// SLA & CALENDAR DTOS & MAPPERS
// =============================================================================

export interface BusinessCalendarResponseDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scopeType: string;
  scopeId: string | null;
  organizationId: string | null;
  communityId: string | null;
  timezone: string;
  workingDays: number[];
  workingHours: BusinessHoursInterval;
  holidays: string[];
  exceptions: BusinessCalendarException[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toBusinessCalendarDto(cal: BusinessCalendar): BusinessCalendarResponseDto {
  return {
    id: cal.id,
    key: cal.key,
    name: cal.name,
    description: cal.description ?? null,
    scopeType: cal.scopeType,
    scopeId: cal.scopeId ?? null,
    organizationId: cal.organizationId ?? null,
    communityId: cal.communityId ?? null,
    timezone: cal.timezone,
    workingDays: cal.workingDays,
    workingHours: cal.workingHours,
    holidays: cal.holidays,
    exceptions: cal.exceptions,
    isDefault: cal.isDefault,
    createdAt: cal.createdAt.toISOString(),
    updatedAt: cal.updatedAt.toISOString(),
  };
}

export interface SlaPolicyResponseDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  scopeType: string;
  scopeId: string | null;
  organizationId: string | null;
  communityId: string | null;
  status: string;
  metricType: string;
  durationMinutes: number;
  useBusinessHours: boolean;
  calendarId: string | null;
  warningThresholdPercent: number;
  startTriggerState: string | null;
  pauseStates: string[];
  stopStates: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toSlaPolicyDto(policy: SlaPolicyDefinition): SlaPolicyResponseDto {
  return {
    id: policy.id,
    key: policy.key,
    name: policy.name,
    description: policy.description ?? null,
    version: policy.version,
    scopeType: policy.scopeType,
    scopeId: policy.scopeId ?? null,
    organizationId: policy.organizationId ?? null,
    communityId: policy.communityId ?? null,
    status: policy.status,
    metricType: policy.metricType,
    durationMinutes: policy.durationMinutes,
    useBusinessHours: policy.useBusinessHours,
    calendarId: policy.calendarId ?? null,
    warningThresholdPercent: policy.warningThresholdPercent,
    startTriggerState: policy.startTriggerState ?? null,
    pauseStates: policy.pauseStates,
    stopStates: policy.stopStates,
    publishedAt: policy.publishedAt ? policy.publishedAt.toISOString() : null,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

export interface SlaInstanceResponseDto {
  id: string;
  policyDefinitionId: string;
  policyKey: string;
  policyVersion: number;
  organizationId: string | null;
  communityId: string | null;
  resourceType: string;
  resourceId: string;
  workflowInstanceId: string | null;
  calendarId: string | null;
  metricType: string;
  durationMinutes: number;
  useBusinessHours: boolean;
  startedAt: string;
  dueAt: string;
  warningAt: string | null;
  pausedAt: string | null;
  totalPausedMinutes: number;
  completedAt: string | null;
  breachedAt: string | null;
  status: string;
  warningNotified: boolean;
  breachNotified: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function toSlaInstanceDto(inst: SlaInstance): SlaInstanceResponseDto {
  return {
    id: inst.id,
    policyDefinitionId: inst.policyDefinitionId,
    policyKey: inst.policyKey,
    policyVersion: inst.policyVersion,
    organizationId: inst.organizationId ?? null,
    communityId: inst.communityId ?? null,
    resourceType: inst.resourceType,
    resourceId: inst.resourceId,
    workflowInstanceId: inst.workflowInstanceId ?? null,
    calendarId: inst.calendarId ?? null,
    metricType: inst.metricType,
    durationMinutes: inst.durationMinutes,
    useBusinessHours: inst.useBusinessHours,
    startedAt: inst.startedAt.toISOString(),
    dueAt: inst.dueAt.toISOString(),
    warningAt: inst.warningAt ? inst.warningAt.toISOString() : null,
    pausedAt: inst.pausedAt ? inst.pausedAt.toISOString() : null,
    totalPausedMinutes: inst.totalPausedMinutes,
    completedAt: inst.completedAt ? inst.completedAt.toISOString() : null,
    breachedAt: inst.breachedAt ? inst.breachedAt.toISOString() : null,
    status: inst.status,
    warningNotified: inst.warningNotified,
    breachNotified: inst.breachNotified,
    version: inst.version,
    createdAt: inst.createdAt.toISOString(),
    updatedAt: inst.updatedAt.toISOString(),
  };
}
