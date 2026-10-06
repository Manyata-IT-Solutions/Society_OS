import { z } from 'zod';
import { uuidSchema, paginationQuerySchema, entityStatusSchema } from './common.js';

export const inventoryItemTypeEnum = z.enum([
  'SPARE_PART',
  'CONSUMABLE',
  'MAINTENANCE_SUPPLY',
  'SAFETY_SUPPLY',
  'CLEANING_SUPPLY',
  'ELECTRICAL',
  'PLUMBING',
  'GENERAL',
  'OTHER',
]);

export const stockTrackingTypeEnum = z.enum(['QUANTITY', 'SERIAL', 'BATCH', 'BATCH_AND_EXPIRY']);

export const inventoryStoreTypeEnum = z.enum([
  'CENTRAL',
  'COMMUNITY',
  'BUILDING',
  'MAINTENANCE',
  'SECURITY',
  'HOUSEKEEPING',
  'TEMPORARY',
  'OTHER',
]);

export const inventoryBatchStatusEnum = z.enum([
  'ACTIVE',
  'EXPIRING_SOON',
  'EXPIRED',
  'QUARANTINED',
  'DEPLETED',
]);

export const inventorySerialStatusEnum = z.enum([
  'IN_STOCK',
  'RESERVED',
  'ISSUED',
  'CONSUMED',
  'RETURNED',
  'INSTALLED',
  'SCRAPPED',
  'CONVERTED_TO_ASSET',
]);

export const stockTransactionTypeEnum = z.enum([
  'OPENING_BALANCE',
  'RECEIPT',
  'ISSUE',
  'RETURN',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'RESERVATION',
  'RESERVATION_RELEASE',
  'CONSUMPTION',
  'REVERSAL',
  'COUNT_RECONCILIATION',
]);

export const inventoryReceiptSourceTypeEnum = z.enum([
  'OPENING',
  'MANUAL_RECEIPT',
  'TRANSFER',
  'RETURN',
  'PURCHASE_ORDER',
  'OTHER',
]);

export const inventoryIssueTypeEnum = z.enum([
  'WORK_ORDER',
  'OPERATIONAL',
  'TEAM',
  'STAFF',
  'GENERAL',
]);

export const materialRequirementPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'EMERGENCY']);

export const inventoryReturnTypeEnum = z.enum(['WORK_ORDER_UNUSED', 'DEFECTIVE', 'GENERAL']);

export const stockAdjustmentReasonEnum = z.enum([
  'DAMAGE',
  'LOSS',
  'FOUND',
  'EXPIRY',
  'COUNT_CORRECTION',
  'DATA_MIGRATION',
  'OTHER',
]);

export const stockCountTypeEnum = z.enum(['FULL', 'CATEGORY', 'BIN', 'AD_HOC', 'CYCLE']);

// Unit of Measure
export const createUnitOfMeasureSchema = z.object({
  organizationId: uuidSchema,
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20),
  precision: z.number().int().min(0).max(4).default(2),
  isBase: z.boolean().default(true),
  baseUomId: uuidSchema.optional().nullable(),
  conversionFactor: z.number().positive().default(1),
  status: entityStatusSchema.default('ACTIVE'),
});

export const updateUnitOfMeasureSchema = createUnitOfMeasureSchema.partial();

// Inventory Category
export const createInventoryCategorySchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  parentId: uuidSchema.optional().nullable(),
  status: entityStatusSchema.default('ACTIVE'),
  customFieldDefinitions: z.array(z.record(z.any())).default([]),
});

export const updateInventoryCategorySchema = createInventoryCategorySchema.partial();

// Inventory Store
export const createInventoryStoreSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  storeType: inventoryStoreTypeEnum.default('MAINTENANCE'),
  propertySectionId: uuidSchema.optional().nullable(),
  buildingId: uuidSchema.optional().nullable(),
  locationDescription: z.string().max(500).optional().nullable(),
  status: entityStatusSchema.default('ACTIVE'),
  managerUserId: uuidSchema.optional().nullable(),
});

export const updateInventoryStoreSchema = createInventoryStoreSchema.partial();

// Stock Bin
export const createStockBinSchema = z.object({
  storeId: uuidSchema,
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  rack: z.string().max(50).optional().nullable(),
  shelf: z.string().max(50).optional().nullable(),
  bin: z.string().max(50).optional().nullable(),
  status: entityStatusSchema.default('ACTIVE'),
});

export const updateStockBinSchema = createStockBinSchema.partial();

// Inventory Item
export const createInventoryItemSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  itemCode: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  categoryId: uuidSchema,
  itemType: inventoryItemTypeEnum.default('SPARE_PART'),
  baseUomId: uuidSchema,
  defaultIssueUomId: uuidSchema.optional().nullable(),
  status: entityStatusSchema.default('ACTIVE'),
  stockTrackingType: stockTrackingTypeEnum.default('QUANTITY'),
  isBatchTracked: z.boolean().default(false),
  isSerialTracked: z.boolean().default(false),
  isExpiryTracked: z.boolean().default(false),
  minStockLevel: z.number().nonnegative().optional().nullable(),
  reorderLevel: z.number().nonnegative().optional().nullable(),
  maxStockLevel: z.number().positive().optional().nullable(),
  preferredStoreId: uuidSchema.optional().nullable(),
  preferredBinId: uuidSchema.optional().nullable(),
  barcodeIdentifier: z.string().max(100).optional().nullable(),
  qrIdentifier: z.string().max(100).optional().nullable(),
  customFields: z.record(z.any()).default({}),
  initialStorePolicy: z
    .object({
      storeId: uuidSchema,
      minQuantity: z.number().nonnegative().default(0),
      reorderLevel: z.number().nonnegative().default(0),
      reorderQuantity: z.number().nonnegative().default(0),
      maxQuantity: z.number().positive().optional().nullable(),
      defaultBinId: uuidSchema.optional().nullable(),
    })
    .optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const updateItemStorePolicySchema = z.object({
  minQuantity: z.number().nonnegative().default(0),
  reorderLevel: z.number().nonnegative().default(0),
  reorderQuantity: z.number().nonnegative().default(0),
  maxQuantity: z.number().positive().optional().nullable(),
  defaultBinId: uuidSchema.optional().nullable(),
  reorderEnabled: z.boolean().default(true),
});

// Inventory Receipt
export const inventoryReceiptLineSchema = z.object({
  itemId: uuidSchema,
  quantity: z.number().positive(),
  uomId: uuidSchema,
  unitPrice: z.number().nonnegative().optional().nullable(),
  batchNumber: z.string().max(100).optional().nullable(),
  expiryDate: z.string().datetime().or(z.date()).optional().nullable(),
  serialNumbers: z.array(z.string().min(1).max(100)).default([]),
  binId: uuidSchema.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createInventoryReceiptSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  storeId: uuidSchema,
  sourceType: inventoryReceiptSourceTypeEnum.default('MANUAL_RECEIPT'),
  sourceReference: z.string().max(100).optional().nullable(),
  supplierName: z.string().max(255).optional().nullable(),
  receivedAt: z
    .string()
    .datetime()
    .or(z.date())
    .default(() => new Date().toISOString()),
  notes: z.string().max(2000).optional().nullable(),
  documentId: uuidSchema.optional().nullable(),
  lines: z.array(inventoryReceiptLineSchema).min(1),
});

export const reverseInventoryReceiptSchema = z.object({
  reason: z.string().min(1).max(500),
});

// Inventory Issue
export const inventoryIssueLineSchema = z.object({
  itemId: uuidSchema,
  requirementId: uuidSchema.optional().nullable(),
  requestedQty: z.number().positive(),
  issuedQty: z.number().positive(),
  uomId: uuidSchema,
  batchId: uuidSchema.optional().nullable(),
  serialIds: z.array(uuidSchema).default([]),
  binId: uuidSchema.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createInventoryIssueSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  storeId: uuidSchema,
  issueType: inventoryIssueTypeEnum.default('WORK_ORDER'),
  workOrderId: uuidSchema.optional().nullable(),
  issuedToUserId: uuidSchema.optional().nullable(),
  issuedToTeamId: uuidSchema.optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  lines: z.array(inventoryIssueLineSchema).min(1),
});

// Work Order Material Integration
export const createWorkOrderMaterialRequirementSchema = z.object({
  itemId: uuidSchema,
  requiredQty: z.number().positive(),
  uomId: uuidSchema,
  priority: materialRequirementPriorityEnum.default('NORMAL'),
  preferredStoreId: uuidSchema.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const reserveStockSchema = z.object({
  storeId: uuidSchema,
  itemId: uuidSchema,
  requirementId: uuidSchema.optional().nullable(),
  batchId: uuidSchema.optional().nullable(),
  quantity: z.number().positive(),
  expiresAt: z.string().datetime().or(z.date()).optional().nullable(),
});

export const recordMaterialConsumptionSchema = z.object({
  issueLineId: uuidSchema,
  itemId: uuidSchema,
  assetId: uuidSchema.optional().nullable(),
  batchId: uuidSchema.optional().nullable(),
  serialId: uuidSchema.optional().nullable(),
  quantity: z.number().positive(),
  uomId: uuidSchema,
  notes: z.string().max(500).optional().nullable(),
});

export const returnWorkOrderMaterialSchema = z.object({
  storeId: uuidSchema,
  lines: z
    .array(
      z.object({
        issueLineId: uuidSchema.optional().nullable(),
        itemId: uuidSchema,
        quantity: z.number().positive(),
        uomId: uuidSchema,
        batchId: uuidSchema.optional().nullable(),
        serialId: uuidSchema.optional().nullable(),
        condition: z.enum(['GOOD', 'DAMAGED', 'SCRAP']).default('GOOD'),
        binId: uuidSchema.optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1),
  notes: z.string().max(500).optional().nullable(),
});

// Stock Transfers
export const stockTransferLineSchema = z.object({
  itemId: uuidSchema,
  requestedQty: z.number().positive(),
  dispatchedQty: z.number().positive(),
  uomId: uuidSchema,
  batchId: uuidSchema.optional().nullable(),
  serialIds: z.array(uuidSchema).default([]),
  sourceBinId: uuidSchema.optional().nullable(),
  destinationBinId: uuidSchema.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createStockTransferSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  sourceStoreId: uuidSchema,
  destinationStoreId: uuidSchema,
  notes: z.string().max(2000).optional().nullable(),
  lines: z.array(stockTransferLineSchema).min(1),
});

// Stock Adjustments
export const stockAdjustmentLineSchema = z.object({
  itemId: uuidSchema,
  binId: uuidSchema.optional().nullable(),
  batchId: uuidSchema.optional().nullable(),
  serialId: uuidSchema.optional().nullable(),
  quantityDelta: z.number().refine((val) => val !== 0, {
    message: 'Quantity delta must be non-zero (positive for addition, negative for deduction)',
  }),
  uomId: uuidSchema,
  reasonDetails: z.string().max(500).optional().nullable(),
});

export const createStockAdjustmentSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  storeId: uuidSchema,
  reason: stockAdjustmentReasonEnum.default('COUNT_CORRECTION'),
  notes: z.string().max(2000).optional().nullable(),
  documentId: uuidSchema.optional().nullable(),
  lines: z.array(stockAdjustmentLineSchema).min(1),
});

// Physical Stock Count
export const stockCountLineInputSchema = z.object({
  itemId: uuidSchema,
  binId: uuidSchema.optional().nullable(),
  batchId: uuidSchema.optional().nullable(),
  countedQty: z.number().nonnegative(),
  uomId: uuidSchema,
  notes: z.string().max(500).optional().nullable(),
});

export const createStockCountSchema = z.object({
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  storeId: uuidSchema,
  countType: stockCountTypeEnum.default('FULL'),
  freezeMovements: z.boolean().default(false),
  notes: z.string().max(2000).optional().nullable(),
  itemIds: z.array(uuidSchema).optional(),
});

export const recordStockCountLinesSchema = z.object({
  lines: z.array(stockCountLineInputSchema).min(1),
});

// Batch & Serial
export const createInventoryBatchSchema = z.object({
  itemId: uuidSchema,
  batchNumber: z.string().min(1).max(100),
  manufacturedAt: z.string().datetime().or(z.date()).optional().nullable(),
  expiryAt: z.string().datetime().or(z.date()).optional().nullable(),
  supplierName: z.string().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const createInventorySerialSchema = z.object({
  itemId: uuidSchema,
  serialNumber: z.string().min(1).max(100),
  currentStoreId: uuidSchema.optional().nullable(),
  currentBinId: uuidSchema.optional().nullable(),
  batchId: uuidSchema.optional().nullable(),
});

export const convertSerialToAssetSchema = z.object({
  serialId: uuidSchema,
  assetCategoryId: uuidSchema,
  assetModelId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(255),
  locationDescription: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// Queries
export const inventoryItemQuerySchema = paginationQuerySchema.extend({
  organizationId: uuidSchema.optional(),
  communityId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  itemType: inventoryItemTypeEnum.optional(),
  status: entityStatusSchema.optional(),
  storeId: uuidSchema.optional(),
  search: z.string().optional(),
  lowStockOnly: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

export const stockLedgerQuerySchema = paginationQuerySchema.extend({
  organizationId: uuidSchema.optional(),
  communityId: uuidSchema.optional(),
  storeId: uuidSchema.optional(),
  itemId: uuidSchema.optional(),
  transactionType: stockTransactionTypeEnum.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});
