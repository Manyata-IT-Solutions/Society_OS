import type { ScopeType } from './auth.js';

// =============================================================================
// WORKFLOW ENGINE TYPES
// =============================================================================

export type WorkflowStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';
export type WorkflowInstanceStatus = 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'SUSPENDED';
export type WorkflowStateType =
  'START' | 'ACTIVE' | 'WAITING' | 'APPROVAL' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface WorkflowStateDescriptor {
  key: string;
  label: string;
  type: WorkflowStateType;
  isTerminal?: boolean;
  displayOrder?: number;
  description?: string;
}

export interface WorkflowTransitionSideEffect {
  type:
    | 'EMIT_EVENT'
    | 'START_APPROVAL'
    | 'START_SLA'
    | 'PAUSE_SLA'
    | 'RESUME_SLA'
    | 'COMPLETE_SLA'
    | 'NOTIFICATION_REQUEST';
  targetKey?: string;
  parameters?: Record<string, unknown>;
}

export interface WorkflowTransitionDescriptor {
  key: string;
  fromState: string;
  toState: string;
  action: string;
  actionLabel?: string;
  requiredPermission?: string;
  guardRuleKey?: string;
  guardRuleVersion?: number;
  approvalPolicyKey?: string;
  approvalPolicyVersion?: number;
  reasonRequired?: boolean;
  commentRequired?: boolean;
  sideEffects?: WorkflowTransitionSideEffect[];
}

export interface WorkflowDefinition {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  version: number;
  scopeType: ScopeType;
  scopeId?: string | null;
  organizationId?: string | null;
  communityId?: string | null;
  status: WorkflowStatus;
  entityType: string;
  initialStateKey: string;
  states: WorkflowStateDescriptor[];
  transitions: WorkflowTransitionDescriptor[];
  createdById?: string | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  workflowDefinitionKey: string;
  workflowVersion: number;
  scopeType: ScopeType;
  organizationId?: string | null;
  communityId?: string | null;
  resourceType: string;
  resourceId: string;
  currentState: string;
  status: WorkflowInstanceStatus;
  contextSnapshot: Record<string, unknown>;
  version: number;
  startedAt: Date;
  completedAt?: Date | null;
  lastTransitionAt: Date;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTransitionHistory {
  id: string;
  workflowInstanceId: string;
  fromState: string;
  toState: string;
  action: string;
  actorId?: string | null;
  actorType: string;
  reason?: string | null;
  comment?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  ruleEvaluationSummary?: Record<string, unknown> | null;
  approvalInstanceId?: string | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface AllowedWorkflowAction {
  action: string;
  label: string;
  targetState: string;
  requiresReason: boolean;
  requiresComment: boolean;
  requiresApproval: boolean;
}

// =============================================================================
// RULES ENGINE TYPES
// =============================================================================

export type RuleStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'IN'
  | 'NOT_IN'
  | 'CONTAINS'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY'
  | 'DATE_BEFORE'
  | 'DATE_AFTER';

export interface SimpleCondition {
  field: string;
  operator: RuleOperator;
  value: unknown;
}

export interface ConditionNode {
  simple?: SimpleCondition;
  and?: ConditionNode[];
  or?: ConditionNode[];
  not?: ConditionNode;
}

export interface RuleDefinition {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  version: number;
  scopeType: ScopeType;
  scopeId?: string | null;
  organizationId?: string | null;
  communityId?: string | null;
  status: RuleStatus;
  resourceType: string;
  inputSchema: Record<string, unknown>;
  conditionTree: ConditionNode;
  outputEffect?: Record<string, unknown> | null;
  createdById?: string | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleEvaluationTrace {
  nodeType: 'simple' | 'and' | 'or' | 'not';
  field?: string;
  operator?: RuleOperator;
  expectedValue?: unknown;
  actualValue?: unknown;
  passed: boolean;
  children?: RuleEvaluationTrace[];
}

export interface RuleEvaluationResult {
  ruleKey: string;
  version: number;
  passed: boolean;
  outputEffect?: Record<string, unknown> | null;
  trace: RuleEvaluationTrace;
  evaluatedAt: Date;
}

// =============================================================================
// APPROVAL ENGINE TYPES
// =============================================================================

export type ApprovalPolicyStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';
export type ApproverType = 'ROLE' | 'PERMISSION' | 'SPECIFIC_USER' | 'RESOURCE_RELATION';
export type ApprovalQuorumMode = 'ANY_ONE' | 'ALL' | 'MIN_COUNT';
export type ApprovalInstanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export type ApprovalDecisionType = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
export type ApprovalRejectionBehavior =
  'TERMINATE_WORKFLOW' | 'RETURN_TO_PREVIOUS_STATE' | 'RETURN_TO_REQUESTER' | 'CUSTOM_TARGET_STATE';

export interface ApprovalStepDefinition {
  order: number;
  name: string;
  approverType: ApproverType;
  approverValue: string;
  quorumMode: ApprovalQuorumMode;
  minCount?: number;
  allowSelfApproval?: boolean;
  rejectionBehavior?: ApprovalRejectionBehavior;
  customTargetState?: string;
  slaPolicyKey?: string;
}

export interface ApprovalPolicyDefinition {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  version: number;
  scopeType: ScopeType;
  scopeId?: string | null;
  organizationId?: string | null;
  communityId?: string | null;
  status: ApprovalPolicyStatus;
  steps: ApprovalStepDefinition[];
  createdById?: string | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalInstance {
  id: string;
  workflowInstanceId?: string | null;
  policyDefinitionId: string;
  policyKey: string;
  policyVersion: number;
  organizationId?: string | null;
  communityId?: string | null;
  resourceType: string;
  resourceId: string;
  requesterId?: string | null;
  status: ApprovalInstanceStatus;
  currentStepOrder: number;
  startedAt: Date;
  completedAt?: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalStepInstance {
  id: string;
  approvalInstanceId: string;
  stepOrder: number;
  name: string;
  approverType: ApproverType;
  approverValue: string;
  quorumMode: ApprovalQuorumMode;
  minCount: number;
  status: ApprovalStepStatus;
  eligibleApproverIds: string[];
  requiredCount?: number | null;
  approvedCount: number;
  rejectedCount: number;
  openedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ActorType = 'USER' | 'SYSTEM' | 'API_KEY';

export interface ApprovalDecision {
  id: string;
  approvalInstanceId: string;
  stepInstanceId: string;
  actorId: string;
  actorType: ActorType;
  decision: ApprovalDecisionType;
  comment?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  occurredAt: Date;
  createdAt: Date;
}

// =============================================================================
// SLA ENGINE & BUSINESS CALENDAR TYPES
// =============================================================================

export type SlaPolicyStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';
export type SlaMetricType =
  | 'TIME_TO_ACKNOWLEDGE'
  | 'TIME_TO_FIRST_ACTION'
  | 'TIME_TO_RESOLUTION'
  | 'TIME_IN_STATE'
  | 'APPROVAL_RESPONSE'
  | 'CUSTOM';
export type SlaInstanceStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'BREACHED' | 'CANCELLED';

export interface BusinessHoursInterval {
  start: string; // e.g. "09:00"
  end: string; // e.g. "17:00"
}

export interface BusinessCalendarException {
  date: string; // "YYYY-MM-DD"
  isWorkingDay: boolean;
  workingHours?: BusinessHoursInterval;
  reason?: string;
}

export interface BusinessCalendar {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  scopeType: ScopeType;
  scopeId?: string | null;
  organizationId?: string | null;
  communityId?: string | null;
  timezone: string;
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (or 1..5)
  workingHours: BusinessHoursInterval;
  holidays: string[]; // "YYYY-MM-DD"
  exceptions: BusinessCalendarException[];
  isDefault: boolean;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlaPolicyDefinition {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  version: number;
  scopeType: ScopeType;
  scopeId?: string | null;
  organizationId?: string | null;
  communityId?: string | null;
  status: SlaPolicyStatus;
  metricType: SlaMetricType;
  durationMinutes: number;
  useBusinessHours: boolean;
  calendarId?: string | null;
  warningThresholdPercent: number;
  startTriggerState?: string | null;
  pauseStates: string[];
  stopStates: string[];
  createdById?: string | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlaInstance {
  id: string;
  policyDefinitionId: string;
  policyKey: string;
  policyVersion: number;
  organizationId?: string | null;
  communityId?: string | null;
  resourceType: string;
  resourceId: string;
  workflowInstanceId?: string | null;
  calendarId?: string | null;
  metricType: SlaMetricType;
  durationMinutes: number;
  useBusinessHours: boolean;
  startedAt: Date;
  dueAt: Date;
  warningAt?: Date | null;
  pausedAt?: Date | null;
  totalPausedMinutes: number;
  completedAt?: Date | null;
  breachedAt?: Date | null;
  status: SlaInstanceStatus;
  warningNotified: boolean;
  breachNotified: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
