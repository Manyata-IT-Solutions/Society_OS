import { z } from 'zod';

export const configurationScopeTypeSchema = z.enum(['PLATFORM', 'ORGANIZATION', 'COMMUNITY']);

export const setConfigurationOverrideSchema = z.object({
  key: z.string().min(1, 'Configuration key is required').max(150),
  scopeType: configurationScopeTypeSchema,
  scopeId: z.string().uuid('Invalid scopeId UUID').nullable().optional(),
  value: z.unknown(),
  changeReason: z.string().max(500).optional(),
});

export type SetConfigurationOverrideInput = z.infer<typeof setConfigurationOverrideSchema>;

export const getConfigurationOverridesQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  scopeType: configurationScopeTypeSchema.optional(),
  namespace: z.string().optional(),
});

export type GetConfigurationOverridesQueryInput = z.infer<
  typeof getConfigurationOverridesQuerySchema
>;

export const getEffectiveConfigurationQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  keys: z.string().optional(), // comma-separated
  namespace: z.string().optional(),
});

export type GetEffectiveConfigurationQueryInput = z.infer<
  typeof getEffectiveConfigurationQuerySchema
>;

// -----------------------------------------------------------------------------
// Feature Flags
// -----------------------------------------------------------------------------

export const featureScopeTypeSchema = z.enum(['PLATFORM', 'ORGANIZATION', 'COMMUNITY']);

export const setFeatureOverrideSchema = z.object({
  featureKey: z.string().min(1, 'Feature key is required').max(150),
  scopeType: featureScopeTypeSchema,
  scopeId: z.string().uuid('Invalid scopeId UUID').nullable().optional(),
  enabled: z.boolean(),
  reason: z.string().max(500).optional(),
});

export type SetFeatureOverrideInput = z.infer<typeof setFeatureOverrideSchema>;

export const getFeatureOverridesQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  scopeType: featureScopeTypeSchema.optional(),
});

export type GetFeatureOverridesQueryInput = z.infer<typeof getFeatureOverridesQuerySchema>;

// -----------------------------------------------------------------------------
// Custom Fields
// -----------------------------------------------------------------------------

export const customFieldEntityTypeSchema = z.enum([
  'COMMUNITY',
  'BUILDING',
  'UNIT',
  'RESIDENT',
  'HOUSEHOLD',
  'DOCUMENT',
  'TICKET',
  'WORK_ORDER',
  'MAINTENANCE_PLAN',
]);

export const customFieldTypeSchema = z.enum([
  'TEXT',
  'LONG_TEXT',
  'NUMBER',
  'DECIMAL',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'SELECT',
  'MULTI_SELECT',
  'EMAIL',
  'PHONE',
  'URL',
]);

export const customFieldStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);

export const customFieldVisibilitySchema = z.enum([
  'PUBLIC',
  'TENANT_INTERNAL',
  'ADMIN_ONLY',
  'RESTRICTED',
]);

export const customFieldOptionSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(150),
  isActive: z.boolean().default(true),
});

export const customFieldValidationRulesSchema = z
  .object({
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    pattern: z.string().max(200).optional(),
    allowedValues: z.array(z.string()).optional(),
  })
  .nullable()
  .optional();

export const createCustomFieldDefinitionSchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  entityType: customFieldEntityTypeSchema,
  key: z
    .string()
    .min(1, 'Key is required')
    .max(100)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Key must contain only alphanumeric characters, underscores, and dashes',
    ),
  label: z.string().min(1, 'Label is required').max(150),
  description: z.string().max(500).optional(),
  fieldType: customFieldTypeSchema,
  required: z.boolean().default(false),
  searchable: z.boolean().default(false),
  filterable: z.boolean().default(false),
  validationRules: customFieldValidationRulesSchema,
  options: z.array(customFieldOptionSchema).optional(),
  defaultValue: z.unknown().optional(),
  displayOrder: z.number().int().default(0),
  visibility: customFieldVisibilitySchema.default('TENANT_INTERNAL'),
});

export type CreateCustomFieldDefinitionInput = z.infer<typeof createCustomFieldDefinitionSchema>;

export const updateCustomFieldDefinitionSchema = z.object({
  label: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional(),
  required: z.boolean().optional(),
  searchable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  status: customFieldStatusSchema.optional(),
  validationRules: customFieldValidationRulesSchema,
  options: z.array(customFieldOptionSchema).optional(),
  defaultValue: z.unknown().optional(),
  displayOrder: z.number().int().optional(),
  visibility: customFieldVisibilitySchema.optional(),
});

export type UpdateCustomFieldDefinitionInput = z.infer<typeof updateCustomFieldDefinitionSchema>;

export const setCustomFieldValueItemSchema = z.object({
  definitionId: z.string().uuid('Invalid definitionId UUID'),
  value: z.unknown(),
});

export const setCustomFieldValuesBulkSchema = z.object({
  values: z.array(setCustomFieldValueItemSchema),
});

export type SetCustomFieldValuesBulkInput = z.infer<typeof setCustomFieldValuesBulkSchema>;

export const getCustomFieldsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  entityType: customFieldEntityTypeSchema.optional(),
  status: customFieldStatusSchema.optional(),
});

export type GetCustomFieldsQueryInput = z.infer<typeof getCustomFieldsQuerySchema>;

// -----------------------------------------------------------------------------
// Terminology
// -----------------------------------------------------------------------------

export const setTerminologySettingsSchema = z.object({
  sectionLabel: z.string().min(1).max(50).default('Section'),
  buildingLabel: z.string().min(1).max(50).default('Building'),
  unitLabel: z.string().min(1).max(50).default('Unit'),
});

export type SetTerminologySettingsInput = z.infer<typeof setTerminologySettingsSchema>;
