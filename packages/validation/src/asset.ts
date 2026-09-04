import { z } from 'zod';

export const assetLifecycleStateSchema = z.enum([
  'REGISTERED',
  'INSTALLED',
  'COMMISSIONED',
  'ACTIVE',
  'SUSPENDED',
  'DECOMMISSIONED',
  'DISPOSED',
]);

export const assetOperationalStatusSchema = z.enum([
  'OPERATIONAL',
  'DEGRADED',
  'OUT_OF_SERVICE',
  'UNDER_MAINTENANCE',
  'UNKNOWN',
]);

export const assetConditionSchema = z.enum(['GOOD', 'FAIR', 'POOR', 'CRITICAL', 'UNKNOWN']);

export const assetCriticalitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const assetLocationTypeSchema = z.enum([
  'COMMUNITY',
  'SECTION',
  'BUILDING',
  'FLOOR',
  'UNIT',
  'COMMON_AREA',
  'OTHER',
]);

export const assetWarrantyStatusSchema = z.enum(['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'VOID']);

export const serviceContractTypeSchema = z.enum([
  'AMC',
  'CMC',
  'WARRANTY_SERVICE',
  'ON_CALL',
  'OTHER',
]);

export const serviceContractStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'EXPIRING_SOON',
  'EXPIRED',
  'TERMINATED',
]);

export const assetMeterTypeSchema = z.enum([
  'RUN_HOURS',
  'CYCLES',
  'KWH',
  'KM',
  'PRESSURE',
  'TEMPERATURE',
  'CUSTOM',
]);

export const assetMeterReadingSourceSchema = z.enum(['MANUAL', 'WORK_ORDER', 'IMPORT', 'IOT']);

export const workOrderAssetRelationTypeSchema = z.enum([
  'PRIMARY_ASSET',
  'RELATED_ASSET',
  'COMPONENT',
]);

export const assetDowntimeReasonSchema = z.enum([
  'BREAKDOWN',
  'EMERGENCY_REPAIR',
  'SCHEDULED_MAINTENANCE',
  'POWER_OUTAGE',
  'OTHER',
]);

export const assetDowntimeImpactSchema = z.enum([
  'FULL_OUTAGE',
  'PARTIAL_DEGRADATION',
  'NO_IMPACT',
]);

// =============================================================================
// CATEGORIES & MODELS
// =============================================================================

export const createAssetCategorySchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid().optional().nullable(),
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  defaultCriticality: assetCriticalitySchema.default('MEDIUM'),
  defaultExpectedLifeYears: z.number().int().positive().optional().nullable(),
  customFieldDefinitions: z.array(z.record(z.unknown())).default([]),
});

export const updateAssetCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  defaultCriticality: assetCriticalitySchema.optional(),
  defaultExpectedLifeYears: z.number().int().positive().optional().nullable(),
  customFieldDefinitions: z.array(z.record(z.unknown())).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const createAssetModelSchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid(),
  manufacturer: z.string().min(1).max(255),
  modelName: z.string().min(1).max(255),
  modelNumber: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  expectedLifeYears: z.number().int().positive().optional().nullable(),
  specifications: z.record(z.unknown()).default({}),
});

export const updateAssetModelSchema = z.object({
  categoryId: z.string().uuid().optional(),
  manufacturer: z.string().min(1).max(255).optional(),
  modelName: z.string().min(1).max(255).optional(),
  modelNumber: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  expectedLifeYears: z.number().int().positive().optional().nullable(),
  specifications: z.record(z.unknown()).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

// =============================================================================
// ASSET CRUD & LIFECYCLE
// =============================================================================

export const createAssetSchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid(),
  assetCode: z.string().max(100).optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  assetCategoryId: z.string().uuid(),
  assetModelId: z.string().uuid().optional().nullable(),
  criticality: assetCriticalitySchema.default('MEDIUM'),
  locationType: assetLocationTypeSchema.default('COMMUNITY'),
  propertySectionId: z.string().uuid().optional().nullable(),
  buildingId: z.string().uuid().optional().nullable(),
  floorId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  locationDescription: z.string().max(500).optional().nullable(),
  parentAssetId: z.string().uuid().optional().nullable(),
  isMovable: z.boolean().default(false),
  serialNumber: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(255).optional().nullable(),
  modelNumber: z.string().max(100).optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  installationDate: z.string().datetime().optional().nullable(),
  expectedLifeYears: z.number().int().positive().optional().nullable(),
  warrantyStartDate: z.string().datetime().optional().nullable(),
  warrantyEndDate: z.string().datetime().optional().nullable(),
  warrantyProviderName: z.string().max(255).optional().nullable(),
  barcodeIdentifier: z.string().max(100).optional().nullable(),
  primaryPhotoDocumentId: z.string().uuid().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  assetCategoryId: z.string().uuid().optional(),
  assetModelId: z.string().uuid().optional().nullable(),
  criticality: assetCriticalitySchema.optional(),
  locationDescription: z.string().max(500).optional().nullable(),
  parentAssetId: z.string().uuid().optional().nullable(),
  isMovable: z.boolean().optional(),
  serialNumber: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(255).optional().nullable(),
  modelNumber: z.string().max(100).optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  installationDate: z.string().datetime().optional().nullable(),
  expectedLifeYears: z.number().int().positive().optional().nullable(),
  warrantyStartDate: z.string().datetime().optional().nullable(),
  warrantyEndDate: z.string().datetime().optional().nullable(),
  warrantyProviderName: z.string().max(255).optional().nullable(),
  barcodeIdentifier: z.string().max(100).optional().nullable(),
  primaryPhotoDocumentId: z.string().uuid().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
});

export const moveAssetLocationSchema = z.object({
  toLocationType: assetLocationTypeSchema,
  toSectionId: z.string().uuid().optional().nullable(),
  toBuildingId: z.string().uuid().optional().nullable(),
  toFloorId: z.string().uuid().optional().nullable(),
  toUnitId: z.string().uuid().optional().nullable(),
  toLocationDescription: z.string().max(500).optional().nullable(),
  reason: z.string().min(1),
});

export const commissionAssetSchema = z.object({
  commissionedAt: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
  initialCondition: assetConditionSchema.default('GOOD'),
  documentId: z.string().uuid().optional().nullable(),
});

export const decommissionAssetSchema = z.object({
  reason: z.string().min(1),
  replacementAssetId: z.string().uuid().optional().nullable(),
  decommissionedAt: z.string().datetime().optional(),
  documentId: z.string().uuid().optional().nullable(),
  cancelActiveWorkOrders: z.boolean().default(false),
});

export const disposeAssetSchema = z.object({
  reason: z.string().min(1),
  disposalMethod: z.string().min(1).max(100),
  disposedAt: z.string().datetime().optional(),
});

export const updateAssetConditionSchema = z.object({
  condition: assetConditionSchema,
  operationalStatus: assetOperationalStatusSchema.optional(),
  notes: z.string().optional().nullable(),
});

export const reportAssetBreakdownSchema = z.object({
  reason: assetDowntimeReasonSchema.default('BREAKDOWN'),
  impactLevel: assetDowntimeImpactSchema.default('FULL_OUTAGE'),
  notes: z.string().min(1),
  createWorkOrder: z.boolean().default(true),
  workOrderTitle: z.string().optional(),
  workOrderPriority: z.enum(['LOW', 'NORMAL', 'HIGH', 'EMERGENCY']).default('HIGH'),
});

// =============================================================================
// WARRANTIES & SERVICE CONTRACTS
// =============================================================================

export const createAssetWarrantySchema = z.object({
  assetId: z.string().uuid(),
  warrantyType: z.string().default('STANDARD'),
  providerName: z.string().min(1).max(255),
  referenceNumber: z.string().max(100).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  coverageSummary: z.string().min(1),
  termsDocumentId: z.string().uuid().optional().nullable(),
});

export const createAssetServiceContractSchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid(),
  contractNumber: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  serviceProviderName: z.string().min(1).max(255),
  contactPhone: z.string().max(50).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  contractType: serviceContractTypeSchema.default('AMC'),
  coverageSummary: z.string().min(1),
  preventiveVisitsPerYear: z.number().int().nonnegative().default(4),
  includesParts: z.boolean().default(false),
  includesLabor: z.boolean().default(true),
  slaResponseHours: z.number().int().positive().optional().nullable(),
  termsDocumentId: z.string().uuid().optional().nullable(),
  coveredAssetIds: z.array(z.string().uuid()).default([]),
});

export const linkAssetServiceContractSchema = z.object({
  assetIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional().nullable(),
});

// =============================================================================
// METERS & READINGS
// =============================================================================

export const createAssetMeterSchema = z.object({
  assetId: z.string().uuid(),
  meterType: assetMeterTypeSchema.default('RUN_HOURS'),
  name: z.string().min(1).max(255),
  unit: z.string().min(1).max(50),
  initialReading: z.number().nonnegative().default(0),
  allowsReset: z.boolean().default(false),
});

export const addAssetMeterReadingSchema = z.object({
  reading: z.number().nonnegative(),
  recordedAt: z.string().datetime().optional(),
  source: assetMeterReadingSourceSchema.default('MANUAL'),
  sourceWorkOrderId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  documentId: z.string().uuid().optional().nullable(),
  isReset: z.boolean().default(false),
});

// =============================================================================
// SERVICE RECORDS & WORK ORDER LINKS
// =============================================================================

export const createAssetServiceRecordSchema = z.object({
  assetId: z.string().uuid(),
  serviceDate: z.string().datetime(),
  serviceType: z
    .enum(['CORRECTIVE', 'PREVENTIVE', 'INSPECTION', 'OVERHAUL', 'COMMISSIONING'])
    .default('PREVENTIVE'),
  providerName: z.string().max(255).optional().nullable(),
  summary: z.string().min(1),
  technicianNotes: z.string().optional().nullable(),
  workOrderId: z.string().uuid().optional().nullable(),
  documentId: z.string().uuid().optional().nullable(),
  source: z.enum(['WORK_ORDER', 'MANUAL_ENTRY', 'IMPORT']).default('MANUAL_ENTRY'),
});

export const linkWorkOrderAssetSchema = z.object({
  assetId: z.string().uuid(),
  relationshipType: workOrderAssetRelationTypeSchema.default('PRIMARY_ASSET'),
  initialCondition: assetConditionSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
});

// =============================================================================
// QUERY FILTERS
// =============================================================================

export const assetQueryFilterSchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  modelId: z.string().uuid().optional(),
  lifecycleState: z
    .union([assetLifecycleStateSchema, z.array(assetLifecycleStateSchema)])
    .optional(),
  operationalStatus: z
    .union([assetOperationalStatusSchema, z.array(assetOperationalStatusSchema)])
    .optional(),
  condition: z.union([assetConditionSchema, z.array(assetConditionSchema)]).optional(),
  criticality: z.union([assetCriticalitySchema, z.array(assetCriticalitySchema)]).optional(),
  buildingId: z.string().uuid().optional(),
  floorId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  parentAssetId: z.string().uuid().optional(),
  isMovable: z.boolean().optional(),
  manufacturer: z.string().optional(),
  search: z.string().optional(),
  warrantyExpiringDays: z.coerce.number().int().positive().optional(),
  contractExpiringDays: z.coerce.number().int().positive().optional(),
  maintenanceDueBefore: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum([
      'assetCode',
      'name',
      'createdAt',
      'installationDate',
      'criticality',
      'warrantyEndDate',
      'nextMaintenanceDueAt',
    ])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
