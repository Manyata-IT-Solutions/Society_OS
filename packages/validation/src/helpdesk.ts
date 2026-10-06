import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from './common.js';

// =============================================================================
// PHASE 8: HELPDESK VALIDATION SCHEMAS
// =============================================================================

export const ticketPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']);
export const ticketSourceEnum = z.enum([
  'RESIDENT_APP',
  'ADMIN_WEB',
  'STAFF_APP',
  'PHONE_DESK',
  'EMAIL',
  'SYSTEM',
  'IMPORT',
]);
export const ticketLocationTypeEnum = z.enum([
  'UNIT',
  'FLOOR',
  'BUILDING',
  'SECTION',
  'COMMON_AREA',
  'COMMUNITY',
  'OTHER',
]);
export const ticketCommentTypeEnum = z.enum(['PUBLIC_REPLY', 'INTERNAL_NOTE', 'SYSTEM_NOTE']);
export const ticketCategoryStatusEnum = z.enum(['ACTIVE', 'ARCHIVED']);
export const helpdeskTeamStatusEnum = z.enum(['ACTIVE', 'ARCHIVED']);
export const ticketRelationTypeEnum = z.enum(['DUPLICATE_OF', 'RELATED_TO', 'CHILD_OF']);
export const ticketResolutionCodeEnum = z.enum([
  'FIXED',
  'NO_FAULT_FOUND',
  'DUPLICATE',
  'USER_GUIDANCE',
  'VENDOR_ACTION_COMPLETED',
  'CANNOT_REPRODUCE',
  'NOT_IN_SCOPE',
]);

// -----------------------------------------------------------------------------
// Category Schemas
// -----------------------------------------------------------------------------

export const createTicketCategorySchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.nullable().optional(),
  parentId: uuidSchema.nullable().optional(),
  key: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_.-]+$/i, 'Key must be alphanumeric, dot, hyphen, or underscore'),
  name: z.string().min(2).max(150),
  description: z.string().max(500).nullable().optional(),
  status: ticketCategoryStatusEnum.default('ACTIVE'),
  defaultPriority: ticketPriorityEnum.default('NORMAL'),
  defaultSlaPolicyId: uuidSchema.nullable().optional(),
  defaultTeamId: uuidSchema.nullable().optional(),
  workflowDefinitionId: uuidSchema.nullable().optional(),
  residentVisible: z.boolean().default(true),
  isSensitive: z.boolean().default(false),
  allowAttachments: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateTicketCategorySchema = createTicketCategorySchema.partial().omit({
  organizationId: true,
  communityId: true,
  key: true,
});

// -----------------------------------------------------------------------------
// Team Schemas
// -----------------------------------------------------------------------------

export const createHelpdeskTeamSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.nullable().optional(),
  key: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9_.-]+$/i, 'Key must be alphanumeric, dot, hyphen, or underscore'),
  name: z.string().min(2).max(150),
  description: z.string().max(500).nullable().optional(),
  status: helpdeskTeamStatusEnum.default('ACTIVE'),
});

export const updateHelpdeskTeamSchema = createHelpdeskTeamSchema.partial().omit({
  organizationId: true,
  communityId: true,
  key: true,
});

export const addHelpdeskTeamMemberSchema = z.object({
  userId: uuidSchema,
  roleInTeam: z.string().max(100).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateHelpdeskTeamMemberSchema = z.object({
  roleInTeam: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

// -----------------------------------------------------------------------------
// Ticket Lifecycle & Operations Schemas
// -----------------------------------------------------------------------------

export const createTicketSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema,
  title: z.string().min(3).max(255),
  description: z.string().min(5).max(10000),
  categoryId: uuidSchema,
  subcategoryId: uuidSchema.nullable().optional(),
  priority: ticketPriorityEnum.optional(),
  source: ticketSourceEnum.default('ADMIN_WEB'),
  locationType: ticketLocationTypeEnum.default('UNIT'),
  propertySectionId: uuidSchema.nullable().optional(),
  buildingId: uuidSchema.nullable().optional(),
  floorId: uuidSchema.nullable().optional(),
  unitId: uuidSchema.nullable().optional(),
  locationDescription: z.string().max(500).nullable().optional(),
  reportedByResidentId: uuidSchema.nullable().optional(),
  assignedTeamId: uuidSchema.nullable().optional(),
  assignedUserId: uuidSchema.nullable().optional(),
  customFieldValues: z.record(z.unknown()).optional(),
});

export const createResidentTicketSchema = z.object({
  communityId: uuidSchema,
  unitId: uuidSchema.optional(),
  title: z.string().min(3).max(255),
  description: z.string().min(5).max(10000),
  categoryId: uuidSchema,
  subcategoryId: uuidSchema.nullable().optional(),
  locationType: ticketLocationTypeEnum.default('UNIT'),
  locationDescription: z.string().max(500).nullable().optional(),
  priority: ticketPriorityEnum.optional(),
  customFieldValues: z.record(z.unknown()).optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(5).max(10000).optional(),
  categoryId: uuidSchema.optional(),
  subcategoryId: uuidSchema.nullable().optional(),
  priority: ticketPriorityEnum.optional(),
  locationType: ticketLocationTypeEnum.optional(),
  propertySectionId: uuidSchema.nullable().optional(),
  buildingId: uuidSchema.nullable().optional(),
  floorId: uuidSchema.nullable().optional(),
  unitId: uuidSchema.nullable().optional(),
  locationDescription: z.string().max(500).nullable().optional(),
  customFieldValues: z.record(z.unknown()).optional(),
});

export const assignTicketSchema = z.object({
  teamId: uuidSchema.nullable().optional(),
  userId: uuidSchema.nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
});

export const changeTicketPrioritySchema = z.object({
  priority: ticketPriorityEnum,
  reason: z.string().min(2).max(500),
});

export const transitionTicketSchema = z.object({
  action: z.string().min(1).max(100),
  comment: z.string().max(2000).optional(),
  reason: z.string().max(500).optional(),
});

export const resolveTicketSchema = z.object({
  resolutionCode: ticketResolutionCodeEnum.default('FIXED'),
  resolutionSummary: z.string().min(3).max(2000),
});

export const closeTicketSchema = z.object({
  reason: z.string().max(500).nullable().optional(),
});

export const reopenTicketSchema = z.object({
  reason: z.string().min(3).max(1000),
});

export const cancelTicketSchema = z.object({
  reason: z.string().min(3).max(1000),
});

export const createTicketCommentSchema = z.object({
  type: ticketCommentTypeEnum.default('PUBLIC_REPLY'),
  body: z.string().min(1).max(10000),
});

export const createTicketFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullable().optional(),
});

export const linkTicketRelationSchema = z.object({
  targetTicketId: uuidSchema,
  relationType: ticketRelationTypeEnum,
});

export const slaOverrideTicketSchema = z.object({
  newDueAt: z.string().datetime(),
  reason: z.string().min(5).max(500),
});

export const ticketFilterSchema = paginationQuerySchema.extend({
  organizationId: uuidSchema.optional(),
  communityId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  subcategoryId: uuidSchema.optional(),
  priority: ticketPriorityEnum.optional(),
  currentState: z.string().optional(),
  isClosed: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional(),
  ),
  assignedTeamId: uuidSchema.optional(),
  assignedUserId: uuidSchema.optional(),
  unassignedOnly: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional(),
  ),
  unitId: uuidSchema.optional(),
  reportedByResidentId: uuidSchema.optional(),
  slaStatus: z.enum(['RUNNING', 'PAUSED', 'BREACHED', 'MET', 'CANCELLED']).optional(),
  search: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type CreateTicketCategoryInput = z.infer<typeof createTicketCategorySchema>;
export type UpdateTicketCategoryInput = z.infer<typeof updateTicketCategorySchema>;
export type CreateHelpdeskTeamInput = z.infer<typeof createHelpdeskTeamSchema>;
export type UpdateHelpdeskTeamInput = z.infer<typeof updateHelpdeskTeamSchema>;
export type AddHelpdeskTeamMemberInput = z.infer<typeof addHelpdeskTeamMemberSchema>;
export type UpdateHelpdeskTeamMemberInput = z.infer<typeof updateHelpdeskTeamMemberSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CreateResidentTicketInput = z.infer<typeof createResidentTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type ChangeTicketPriorityInput = z.infer<typeof changeTicketPrioritySchema>;
export type TransitionTicketInput = z.infer<typeof transitionTicketSchema>;
export type ResolveTicketInput = z.infer<typeof resolveTicketSchema>;
export type CloseTicketInput = z.infer<typeof closeTicketSchema>;
export type ReopenTicketInput = z.infer<typeof reopenTicketSchema>;
export type CancelTicketInput = z.infer<typeof cancelTicketSchema>;
export type CreateTicketCommentInput = z.infer<typeof createTicketCommentSchema>;
export type CreateTicketFeedbackInput = z.infer<typeof createTicketFeedbackSchema>;
export type LinkTicketRelationInput = z.infer<typeof linkTicketRelationSchema>;
export type SlaOverrideTicketInput = z.infer<typeof slaOverrideTicketSchema>;
export type TicketFilterInput = z.infer<typeof ticketFilterSchema>;
