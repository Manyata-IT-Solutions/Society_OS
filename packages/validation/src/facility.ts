import { z } from 'zod';

export const workOrderTypeSchema = z.enum([
  'CORRECTIVE',
  'PREVENTIVE',
  'INSPECTION',
  'ROUTINE',
  'EMERGENCY',
  'OTHER',
]);

export const workOrderSourceSchema = z.enum([
  'HELPDESK_TICKET',
  'PREVENTIVE_PLAN',
  'MANUAL',
  'INSPECTION',
  'SYSTEM',
]);

export const workOrderPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']);

export const workOrderLocationTypeSchema = z.enum([
  'COMMUNITY',
  'SECTION',
  'BUILDING',
  'FLOOR',
  'UNIT',
  'COMMON_AREA',
  'OTHER',
]);

export const ticketWorkOrderRelationTypeSchema = z.enum([
  'GENERATED_FROM',
  'RELATED_WORK',
  'FOLLOW_UP',
]);

export const workOrderTaskStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
  'BLOCKED',
]);

export const facilityChecklistTemplateStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const checklistItemTypeSchema = z.enum([
  'BOOLEAN',
  'PASS_FAIL',
  'TEXT',
  'NUMBER',
  'DECIMAL',
  'DATE',
  'SELECT',
  'PHOTO_REQUIRED',
]);

export const maintenancePlanStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']);

export const maintenanceScheduleTypeSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM_RRULE',
]);

export const maintenanceMissedPolicySchema = z.enum([
  'SKIP_MISSED',
  'GENERATE_LATEST',
  'GENERATE_ALL_WITH_LIMIT',
]);

export const workLogTypeSchema = z.enum(['WORK', 'TRAVEL', 'WAITING', 'INSPECTION']);

export const workEvidenceTypeSchema = z.enum([
  'WORK_ORDER_ATTACHMENT',
  'BEFORE_PHOTO',
  'AFTER_PHOTO',
  'COMPLETION_PROOF',
  'CHECKLIST_EVIDENCE',
]);

export const workOrderBlockerReasonSchema = z.enum([
  'PART_REQUIRED',
  'VENDOR_REQUIRED',
  'ACCESS_REQUIRED',
  'RESIDENT_RESPONSE',
  'SAFETY',
  'WEATHER',
  'OTHER',
]);

// -----------------------------------------------------------------------------
// CRUD & Action Schemas
// -----------------------------------------------------------------------------

export const createFacilityWorkCategorySchema = z.object({
  key: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_.-]+$/i, 'Key must be alphanumeric with dots/dashes/underscores'),
  name: z.string().min(2).max(150),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).default('ACTIVE'),
  defaultTeamId: z.string().uuid().optional().nullable(),
  defaultPriority: workOrderPrioritySchema.default('NORMAL'),
  defaultSlaPolicyId: z.string().uuid().optional().nullable(),
});

export const updateFacilityWorkCategorySchema = createFacilityWorkCategorySchema.partial();

export const createWorkOrderSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(5),
  workType: workOrderTypeSchema.default('CORRECTIVE'),
  priority: workOrderPrioritySchema.default('NORMAL'),
  categoryId: z.string().uuid().optional().nullable(),
  locationType: workOrderLocationTypeSchema.default('COMMON_AREA'),
  propertySectionId: z.string().uuid().optional().nullable(),
  buildingId: z.string().uuid().optional().nullable(),
  floorId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  locationDescription: z.string().max(500).optional().nullable(),
  source: workOrderSourceSchema.default('MANUAL'),
  maintenancePlanId: z.string().uuid().optional().nullable(),
  scheduledStartAt: z.string().datetime().optional().nullable(),
  scheduledEndAt: z.string().datetime().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  primaryTeamId: z.string().uuid().optional().nullable(),
  primaryAssigneeId: z.string().uuid().optional().nullable(),
  workflowDefinitionKey: z.string().optional(),
  checklistTemplateId: z.string().uuid().optional().nullable(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(2).max(255),
        description: z.string().optional().nullable(),
        sequence: z.number().int().default(1),
        isRequired: z.boolean().default(true),
      }),
    )
    .optional(),
  ticketId: z.string().uuid().optional().nullable(),
  ticketRelationshipType: ticketWorkOrderRelationTypeSchema.default('GENERATED_FROM'),
  customFields: z.record(z.unknown()).optional(),
});

export const updateWorkOrderSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(5).optional(),
  workType: workOrderTypeSchema.optional(),
  priority: workOrderPrioritySchema.optional(),
  categoryId: z.string().uuid().optional().nullable(),
  locationType: workOrderLocationTypeSchema.optional(),
  propertySectionId: z.string().uuid().optional().nullable(),
  buildingId: z.string().uuid().optional().nullable(),
  floorId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  locationDescription: z.string().max(500).optional().nullable(),
  scheduledStartAt: z.string().datetime().optional().nullable(),
  scheduledEndAt: z.string().datetime().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
});

export const assignWorkOrderSchema = z.object({
  teamId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  reason: z.string().max(500).optional(),
});

export const transitionWorkOrderSchema = z.object({
  action: z.string().min(1).max(100),
  reason: z.string().max(500).optional(),
  comment: z.string().optional(),
});

export const blockWorkOrderSchema = z.object({
  reason: z.string().min(3).max(500),
  category: workOrderBlockerReasonSchema.default('OTHER'),
  expectedResumeDate: z.string().datetime().optional().nullable(),
});

export const completeWorkOrderSchema = z.object({
  completionSummary: z.string().min(3),
  resolutionCode: z.string().max(100).optional().nullable(),
});

export const supervisorReviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REWORK_REQUESTED']),
  reviewNotes: z.string().optional().nullable(),
});

export const createWorkOrderTaskSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  sequence: z.number().int().default(1),
  isRequired: z.boolean().default(true),
  assignedUserId: z.string().uuid().optional().nullable(),
});

export const updateWorkOrderTaskSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  sequence: z.number().int().optional(),
  isRequired: z.boolean().optional(),
  status: workOrderTaskStatusSchema.optional(),
  assignedUserId: z.string().uuid().optional().nullable(),
  resultNotes: z.string().optional().nullable(),
});

export const submitChecklistResultSchema = z.object({
  itemId: z.string().min(1).max(100),
  itemLabel: z.string().min(1).max(255),
  itemType: checklistItemTypeSchema,
  isRequired: z.boolean().default(false),
  valueBoolean: z.boolean().optional().nullable(),
  valueText: z.string().optional().nullable(),
  valueNumber: z.number().int().optional().nullable(),
  valueDecimal: z.number().optional().nullable(),
  valueDate: z.string().datetime().optional().nullable(),
  valueSelect: z.string().optional().nullable(),
  documentId: z.string().uuid().optional().nullable(),
  isPassed: z.boolean().optional().nullable(),
  failureComment: z.string().max(500).optional().nullable(),
});

export const createChecklistTemplateSchema = z.object({
  name: z.string().min(2).max(255),
  code: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_.-]+$/i),
  status: facilityChecklistTemplateStatusSchema.default('DRAFT'),
  categoryId: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        description: z.string().optional(),
        itemType: checklistItemTypeSchema,
        isRequired: z.boolean().default(false),
        options: z.array(z.string()).optional(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
        unitLabel: z.string().optional(),
        failureRequiresComment: z.boolean().optional(),
        failureRequiresPhoto: z.boolean().optional(),
      }),
    )
    .min(1),
});

export const updateChecklistTemplateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  status: facilityChecklistTemplateStatusSchema.optional(),
  categoryId: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        description: z.string().optional(),
        itemType: checklistItemTypeSchema,
        isRequired: z.boolean().default(false),
        options: z.array(z.string()).optional(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
        unitLabel: z.string().optional(),
        failureRequiresComment: z.boolean().optional(),
        failureRequiresPhoto: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const startWorkLogTimerSchema = z.object({
  type: workLogTypeSchema.default('WORK'),
  notes: z.string().optional().nullable(),
});

export const stopWorkLogTimerSchema = z.object({
  notes: z.string().optional().nullable(),
});

export const createManualWorkLogSchema = z.object({
  type: workLogTypeSchema.default('WORK'),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  notes: z.string().optional().nullable(),
});

export const attachWorkOrderEvidenceSchema = z.object({
  documentId: z.string().uuid(),
  evidenceType: workEvidenceTypeSchema.default('WORK_ORDER_ATTACHMENT'),
  caption: z.string().max(255).optional().nullable(),
});

export const createMaintenancePlanSchema = z.object({
  name: z.string().min(3).max(255),
  code: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_.-]+$/i),
  description: z.string().optional().nullable(),
  status: maintenancePlanStatusSchema.default('DRAFT'),
  workCategoryId: z.string().uuid().optional().nullable(),
  workType: workOrderTypeSchema.default('PREVENTIVE'),
  scheduleType: maintenanceScheduleTypeSchema.default('MONTHLY'),
  scheduleDefinition: z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    monthOfYear: z.number().int().min(1).max(12).optional(),
    timeOfDay: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM format')
      .default('09:00'),
    rrule: z.string().optional(),
    interval: z.number().int().positive().optional(),
  }),
  timezone: z.string().default('UTC'),
  businessCalendarId: z.string().uuid().optional().nullable(),
  defaultPriority: workOrderPrioritySchema.default('NORMAL'),
  defaultTeamId: z.string().uuid().optional().nullable(),
  workflowDefinitionId: z.string().uuid().optional().nullable(),
  checklistTemplateId: z.string().uuid().optional().nullable(),
  estimatedDurationMinutes: z.number().int().positive().optional().nullable(),
  generationPolicy: maintenanceMissedPolicySchema.default('SKIP_MISSED'),
  leadTimeDays: z.number().int().min(0).default(0),
  targetLocationType: workOrderLocationTypeSchema.default('COMMUNITY'),
  targetSectionId: z.string().uuid().optional().nullable(),
  targetBuildingId: z.string().uuid().optional().nullable(),
  targetFloorId: z.string().uuid().optional().nullable(),
  targetUnitId: z.string().uuid().optional().nullable(),
  targetLocationDescription: z.string().max(500).optional().nullable(),
});

export const updateMaintenancePlanSchema = createMaintenancePlanSchema.partial();

export const linkTicketToWorkOrderSchema = z.object({
  ticketId: z.string().uuid(),
  relationshipType: ticketWorkOrderRelationTypeSchema.default('GENERATED_FROM'),
});

export const workOrderFilterQuerySchema = z.object({
  currentState: z.union([z.string(), z.array(z.string())]).optional(),
  workType: z.union([workOrderTypeSchema, z.array(workOrderTypeSchema)]).optional(),
  priority: z.union([workOrderPrioritySchema, z.array(workOrderPrioritySchema)]).optional(),
  categoryId: z.string().uuid().optional(),
  primaryTeamId: z.string().uuid().optional(),
  primaryAssigneeId: z.string().uuid().optional(),
  buildingId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  source: workOrderSourceSchema.optional(),
  maintenancePlanId: z.string().uuid().optional(),
  isBlocked: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  isOverdue: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  dueFrom: z.string().datetime().optional(),
  dueTo: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().int().positive()).default(1),
  limit: z.preprocess((val) => Number(val) || 20, z.number().int().positive().max(100)).default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'priority', 'dueAt', 'scheduledStartAt', 'workOrderNumber'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const maintenancePlanFilterQuerySchema = z.object({
  status: z.union([maintenancePlanStatusSchema, z.array(maintenancePlanStatusSchema)]).optional(),
  workCategoryId: z.string().uuid().optional(),
  defaultTeamId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().int().positive()).default(1),
  limit: z.preprocess((val) => Number(val) || 20, z.number().int().positive().max(100)).default(20),
});
