import { z } from 'zod';

// =============================================================================
// WORKFLOW VALIDATION SCHEMAS
// =============================================================================

export const WorkflowStateTypeEnum = z.enum([
  'START',
  'ACTIVE',
  'WAITING',
  'APPROVAL',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
]);

export const WorkflowStateSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  label: z.string().min(1).max(150),
  type: WorkflowStateTypeEnum,
  isTerminal: z.boolean().optional().default(false),
  displayOrder: z.number().int().optional().default(0),
  description: z.string().max(500).optional(),
});

export const WorkflowTransitionSideEffectSchema = z.object({
  type: z.enum([
    'EMIT_EVENT',
    'START_APPROVAL',
    'START_SLA',
    'PAUSE_SLA',
    'RESUME_SLA',
    'COMPLETE_SLA',
    'NOTIFICATION_REQUEST',
  ]),
  targetKey: z.string().max(100).optional(),
  parameters: z.record(z.unknown()).optional(),
});

export const WorkflowTransitionSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  fromState: z.string().min(1).max(100),
  toState: z.string().min(1).max(100),
  action: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  actionLabel: z.string().max(150).optional(),
  requiredPermission: z.string().max(100).optional(),
  guardRuleKey: z.string().max(100).optional(),
  guardRuleVersion: z.number().int().positive().optional(),
  approvalPolicyKey: z.string().max(100).optional(),
  approvalPolicyVersion: z.number().int().positive().optional(),
  reasonRequired: z.boolean().optional().default(false),
  commentRequired: z.boolean().optional().default(false),
  sideEffects: z.array(WorkflowTransitionSideEffectSchema).max(10).optional().default([]),
});

export const CreateWorkflowDefinitionSchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),
  communityId: z.string().uuid().optional().nullable(),
  scopeType: z.enum(['PLATFORM', 'ORGANIZATION', 'COMMUNITY']).default('PLATFORM'),
  key: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(\.[a-z0-9_-]+)+$/, 'Workflow key must be namespaced (e.g. review.standard)'),
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  entityType: z.string().min(1).max(100),
  initialStateKey: z.string().min(1).max(100),
  states: z.array(WorkflowStateSchema).min(2).max(30),
  transitions: z.array(WorkflowTransitionSchema).min(1).max(100),
});

export const UpdateWorkflowDefinitionSchema = CreateWorkflowDefinitionSchema.partial();

export const TransitionWorkflowSchema = z.object({
  action: z.string().min(1).max(100),
  reason: z.string().max(500).optional(),
  comment: z.string().max(2000).optional(),
  expectedVersion: z.number().int().positive().optional(),
  context: z.record(z.unknown()).optional(),
});

export const OverrideWorkflowSchema = z.object({
  targetState: z.string().min(1).max(100),
  reason: z.string().min(5).max(500),
  comment: z.string().max(2000).optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const StartWorkflowInstanceSchema = z.object({
  workflowDefinitionKey: z.string().min(1).max(100),
  workflowVersion: z.number().int().positive().optional(),
  organizationId: z.string().uuid().optional().nullable(),
  communityId: z.string().uuid().optional().nullable(),
  resourceType: z.string().min(1).max(100),
  resourceId: z.string().uuid(),
  contextSnapshot: z.record(z.unknown()).optional().default({}),
});

export const SimulateWorkflowTransitionSchema = z.object({
  currentState: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  facts: z.record(z.unknown()).default({}),
});

// =============================================================================
// RULES ENGINE VALIDATION SCHEMAS
// =============================================================================

export const RuleOperatorEnum = z.enum([
  'EQUALS',
  'NOT_EQUALS',
  'GREATER_THAN',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN',
  'LESS_THAN_OR_EQUAL',
  'IN',
  'NOT_IN',
  'CONTAINS',
  'IS_EMPTY',
  'IS_NOT_EMPTY',
  'DATE_BEFORE',
  'DATE_AFTER',
]);

export const SimpleConditionSchema = z.object({
  field: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  operator: RuleOperatorEnum,
  value: z.unknown(),
});

// Recursive AST Node Schema with depth protection
export type ConditionNodeInput = {
  simple?: { field: string; operator: z.infer<typeof RuleOperatorEnum>; value?: unknown };
  and?: ConditionNodeInput[];
  or?: ConditionNodeInput[];
  not?: ConditionNodeInput;
};

export const ConditionNodeSchema: z.ZodType<ConditionNodeInput> = z.lazy(() =>
  z
    .object({
      simple: SimpleConditionSchema.optional(),
      and: z.array(ConditionNodeSchema).max(10).optional(),
      or: z.array(ConditionNodeSchema).max(10).optional(),
      not: ConditionNodeSchema.optional(),
    })
    .refine(
      (data) => {
        const definedCount = [data.simple, data.and, data.or, data.not].filter(Boolean).length;
        return definedCount === 1;
      },
      { message: 'ConditionNode must define exactly one of simple, and, or, or not.' },
    ),
);

export const CreateRuleDefinitionSchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),
  communityId: z.string().uuid().optional().nullable(),
  scopeType: z.enum(['PLATFORM', 'ORGANIZATION', 'COMMUNITY']).default('PLATFORM'),
  key: z
    .string()
    .min(3)
    .max(100)
    .regex(
      /^[a-z0-9]+(\.[a-z0-9_-]+)+$/,
      'Rule key must be namespaced (e.g. guard.approvalThreshold)',
    ),
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  resourceType: z.string().min(1).max(100),
  inputSchema: z.record(z.unknown()).optional().default({}),
  conditionTree: ConditionNodeSchema,
  outputEffect: z.record(z.unknown()).optional().nullable(),
});

export const UpdateRuleDefinitionSchema = CreateRuleDefinitionSchema.partial();

export const SimulateRuleSchema = z.object({
  facts: z.record(z.unknown()),
  conditionTree: ConditionNodeSchema.optional(),
});

// =============================================================================
// APPROVAL ENGINE VALIDATION SCHEMAS
// =============================================================================

export const ApproverTypeEnum = z.enum([
  'ROLE',
  'PERMISSION',
  'SPECIFIC_USER',
  'RESOURCE_RELATION',
]);

export const ApprovalQuorumModeEnum = z.enum(['ANY_ONE', 'ALL', 'MIN_COUNT']);

export const ApprovalRejectionBehaviorEnum = z.enum([
  'TERMINATE_WORKFLOW',
  'RETURN_TO_PREVIOUS_STATE',
  'RETURN_TO_REQUESTER',
  'CUSTOM_TARGET_STATE',
]);

export const ApprovalStepDefinitionSchema = z.object({
  order: z.number().int().min(1).max(20),
  name: z.string().min(1).max(150),
  approverType: ApproverTypeEnum,
  approverValue: z.string().min(1).max(150),
  quorumMode: ApprovalQuorumModeEnum.default('ANY_ONE'),
  minCount: z.number().int().min(1).max(50).optional().default(1),
  allowSelfApproval: z.boolean().optional().default(false),
  rejectionBehavior: ApprovalRejectionBehaviorEnum.optional().default('TERMINATE_WORKFLOW'),
  customTargetState: z.string().max(100).optional(),
  slaPolicyKey: z.string().max(100).optional(),
});

export const CreateApprovalPolicySchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),
  communityId: z.string().uuid().optional().nullable(),
  scopeType: z.enum(['PLATFORM', 'ORGANIZATION', 'COMMUNITY']).default('PLATFORM'),
  key: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(\.[a-z0-9_-]+)+$/, 'Policy key must be namespaced'),
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  steps: z.array(ApprovalStepDefinitionSchema).min(1).max(20),
});

export const UpdateApprovalPolicySchema = CreateApprovalPolicySchema.partial();

export const SubmitApprovalDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  comment: z.string().max(2000).optional(),
});

// =============================================================================
// SLA ENGINE & CALENDAR VALIDATION SCHEMAS
// =============================================================================

export const BusinessHoursIntervalSchema = z
  .object({
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
  })
  .refine((data) => data.start < data.end, {
    message: 'Working hours start time must precede end time',
  });

export const BusinessCalendarExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  isWorkingDay: z.boolean(),
  workingHours: BusinessHoursIntervalSchema.optional(),
  reason: z.string().max(200).optional(),
});

export const CreateBusinessCalendarSchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),
  communityId: z.string().uuid().optional().nullable(),
  scopeType: z.enum(['PLATFORM', 'ORGANIZATION', 'COMMUNITY']).default('PLATFORM'),
  key: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(\.[a-z0-9_-]+)+$/),
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  timezone: z.string().min(1).max(100).default('UTC'),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7).default([1, 2, 3, 4, 5]),
  workingHours: BusinessHoursIntervalSchema.default({ start: '09:00', end: '17:00' }),
  holidays: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .max(366)
    .default([]),
  exceptions: z.array(BusinessCalendarExceptionSchema).max(366).default([]),
  isDefault: z.boolean().optional().default(false),
});

export const UpdateBusinessCalendarSchema = CreateBusinessCalendarSchema.partial();

export const SlaMetricTypeEnum = z.enum([
  'TIME_TO_ACKNOWLEDGE',
  'TIME_TO_FIRST_ACTION',
  'TIME_TO_RESOLUTION',
  'TIME_IN_STATE',
  'APPROVAL_RESPONSE',
  'CUSTOM',
]);

export const CreateSlaPolicySchema = z.object({
  organizationId: z.string().uuid().optional().nullable(),
  communityId: z.string().uuid().optional().nullable(),
  scopeType: z.enum(['PLATFORM', 'ORGANIZATION', 'COMMUNITY']).default('PLATFORM'),
  key: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(\.[a-z0-9_-]+)+$/),
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  metricType: SlaMetricTypeEnum.default('TIME_TO_RESOLUTION'),
  durationMinutes: z.number().int().positive().max(525600), // Max 1 year in minutes
  useBusinessHours: z.boolean().default(true),
  calendarId: z.string().uuid().optional().nullable(),
  warningThresholdPercent: z.number().int().min(1).max(99).default(80),
  startTriggerState: z.string().max(100).optional().nullable(),
  pauseStates: z.array(z.string().max(100)).max(20).default([]),
  stopStates: z.array(z.string().max(100)).max(20).default([]),
});

export const UpdateSlaPolicySchema = CreateSlaPolicySchema.partial();

export const OverrideSlaSchema = z.object({
  action: z.enum(['PAUSE', 'RESUME', 'CANCEL', 'EXTEND']),
  additionalMinutes: z.number().int().positive().optional(),
  reason: z.string().min(3).max(500),
});
