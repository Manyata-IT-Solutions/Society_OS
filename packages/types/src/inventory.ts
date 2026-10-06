import type { EntityStatus } from './domain.js';

export type InventoryItemType =
  | 'SPARE_PART'
  | 'CONSUMABLE'
  | 'MAINTENANCE_SUPPLY'
  | 'SAFETY_SUPPLY'
  | 'CLEANING_SUPPLY'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'GENERAL'
  | 'OTHER';

export type StockTrackingType = 'QUANTITY' | 'SERIAL' | 'BATCH' | 'BATCH_AND_EXPIRY';

export type InventoryStoreType =
  | 'CENTRAL'
  | 'COMMUNITY'
  | 'BUILDING'
  | 'MAINTENANCE'
  | 'SECURITY'
  | 'HOUSEKEEPING'
  | 'TEMPORARY'
  | 'OTHER';

export type InventoryBatchStatus =
  'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'QUARANTINED' | 'DEPLETED';

export type InventorySerialStatus =
  | 'IN_STOCK'
  | 'RESERVED'
  | 'ISSUED'
  | 'CONSUMED'
  | 'RETURNED'
  | 'INSTALLED'
  | 'SCRAPPED'
  | 'CONVERTED_TO_ASSET';

export type StockTransactionType =
  | 'OPENING_BALANCE'
  | 'RECEIPT'
  | 'ISSUE'
  | 'RETURN'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'CONSUMPTION'
  | 'REVERSAL'
  | 'COUNT_RECONCILIATION';

export type StockReferenceType =
  | 'RECEIPT'
  | 'ISSUE'
  | 'WORK_ORDER'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'STOCK_COUNT'
  | 'OPENING'
  | 'MANUAL';

export type InventoryReceiptSourceType =
  'OPENING' | 'MANUAL_RECEIPT' | 'TRANSFER' | 'RETURN' | 'PURCHASE_ORDER' | 'OTHER';

export type InventoryReceiptStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';

export type InventoryIssueType = 'WORK_ORDER' | 'OPERATIONAL' | 'TEAM' | 'STAFF' | 'GENERAL';

export type InventoryIssueStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'APPROVED'
  | 'POSTED'
  | 'PARTIALLY_RETURNED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REVERSED';

export type MaterialRequirementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';

export type MaterialRequirementStatus =
  | 'REQUESTED'
  | 'RESERVED'
  | 'PARTIALLY_RESERVED'
  | 'ISSUED'
  | 'PARTIALLY_ISSUED'
  | 'FULFILLED'
  | 'CANCELLED';

export type StockReservationStatus = 'ACTIVE' | 'FULFILLED' | 'RELEASED' | 'EXPIRED';

export type InventoryReturnType = 'WORK_ORDER_UNUSED' | 'DEFECTIVE' | 'GENERAL';

export type InventoryReturnStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export type StockTransferStatus = 'DRAFT' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED';

export type StockAdjustmentReason =
  'DAMAGE' | 'LOSS' | 'FOUND' | 'EXPIRY' | 'COUNT_CORRECTION' | 'DATA_MIGRATION' | 'OTHER';

export type StockAdjustmentStatus =
  'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'POSTED' | 'REVERSED';

export type StockCountType = 'FULL' | 'CATEGORY' | 'BIN' | 'AD_HOC' | 'CYCLE';

export type StockCountStatus =
  'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED' | 'POSTED' | 'CANCELLED';

export type InventoryImportJobStatus =
  'PENDING' | 'VALIDATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface UnitOfMeasure {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  symbol: string;
  precision: number;
  isBase: boolean;
  baseUomId?: string | null;
  conversionFactor: number;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryCategory {
  id: string;
  organizationId: string;
  communityId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  status: EntityStatus;
  customFieldDefinitions: any[];
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStore {
  id: string;
  organizationId: string;
  communityId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  storeType: InventoryStoreType;
  propertySectionId?: string | null;
  buildingId?: string | null;
  locationDescription?: string | null;
  status: EntityStatus;
  managerUserId?: string | null;
  version: number;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockBin {
  id: string;
  storeId: string;
  code: string;
  name: string;
  rack?: string | null;
  shelf?: string | null;
  bin?: string | null;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  communityId?: string | null;
  itemCode: string;
  name: string;
  description?: string | null;
  categoryId: string;
  itemType: InventoryItemType;
  baseUomId: string;
  defaultIssueUomId?: string | null;
  status: EntityStatus;
  stockTrackingType: StockTrackingType;
  isBatchTracked: boolean;
  isSerialTracked: boolean;
  isExpiryTracked: boolean;
  minStockLevel?: number | null;
  reorderLevel?: number | null;
  maxStockLevel?: number | null;
  preferredStoreId?: string | null;
  preferredBinId?: string | null;
  barcodeIdentifier?: string | null;
  qrIdentifier?: string | null;
  customFields?: Record<string, any>;
  version: number;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemStorePolicy {
  id: string;
  itemId: string;
  storeId: string;
  minQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  maxQuantity?: number | null;
  defaultBinId?: string | null;
  reorderEnabled: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryBatch {
  id: string;
  itemId: string;
  batchNumber: string;
  manufacturedAt?: Date | null;
  expiryAt?: Date | null;
  supplierName?: string | null;
  status: InventoryBatchStatus;
  notes?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventorySerial {
  id: string;
  itemId: string;
  serialNumber: string;
  status: InventorySerialStatus;
  currentStoreId?: string | null;
  currentBinId?: string | null;
  currentWorkOrderId?: string | null;
  batchId?: string | null;
  assetId?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockBalance {
  id: string;
  storeId: string;
  binId?: string | null;
  itemId: string;
  batchId?: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  version: number;
  lastMovementAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLedgerEntry {
  id: string;
  organizationId: string;
  communityId?: string | null;
  storeId: string;
  binId?: string | null;
  itemId: string;
  batchId?: string | null;
  serialId?: string | null;
  transactionType: StockTransactionType;
  quantityDelta: number;
  uom: string;
  referenceType: StockReferenceType;
  referenceId?: string | null;
  occurredAt: Date;
  createdById?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
}

export interface InventoryReceipt {
  id: string;
  organizationId: string;
  communityId?: string | null;
  receiptNumber: string;
  storeId: string;
  sourceType: InventoryReceiptSourceType;
  sourceReference?: string | null;
  supplierName?: string | null;
  status: InventoryReceiptStatus;
  receivedAt: Date;
  receivedById?: string | null;
  notes?: string | null;
  documentId?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  lines?: InventoryReceiptLine[];
}

export interface InventoryReceiptLine {
  id: string;
  receiptId: string;
  itemId: string;
  quantity: number;
  uomId: string;
  unitPrice?: number | null;
  batchNumber?: string | null;
  expiryDate?: Date | null;
  serialNumbers?: string[];
  binId?: string | null;
  batchId?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface InventoryIssue {
  id: string;
  organizationId: string;
  communityId?: string | null;
  issueNumber: string;
  storeId: string;
  issueType: InventoryIssueType;
  workOrderId?: string | null;
  issuedToUserId?: string | null;
  issuedToTeamId?: string | null;
  status: InventoryIssueStatus;
  requestedAt?: Date | null;
  requestedById?: string | null;
  approvedById?: string | null;
  approvedAt?: Date | null;
  issuedAt?: Date | null;
  issuedById?: string | null;
  notes?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  lines?: InventoryIssueLine[];
}

export interface InventoryIssueLine {
  id: string;
  issueId: string;
  itemId: string;
  requirementId?: string | null;
  requestedQty: number;
  approvedQty?: number | null;
  issuedQty: number;
  returnedQty: number;
  consumedQty: number;
  uomId: string;
  batchId?: string | null;
  serialIds?: string[];
  binId?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface WorkOrderMaterialRequirement {
  id: string;
  workOrderId: string;
  itemId: string;
  requiredQty: number;
  reservedQty: number;
  issuedQty: number;
  consumedQty: number;
  returnedQty: number;
  uomId: string;
  priority: MaterialRequirementPriority;
  status: MaterialRequirementStatus;
  preferredStoreId?: string | null;
  notes?: string | null;
  requestedById?: string | null;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockReservation {
  id: string;
  storeId: string;
  itemId: string;
  workOrderId: string;
  requirementId?: string | null;
  batchId?: string | null;
  quantity: number;
  status: StockReservationStatus;
  expiresAt?: Date | null;
  createdById?: string | null;
  releasedAt?: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderMaterialConsumption {
  id: string;
  workOrderId: string;
  issueLineId: string;
  itemId: string;
  assetId?: string | null;
  batchId?: string | null;
  serialId?: string | null;
  quantity: number;
  uomId: string;
  notes?: string | null;
  recordedById?: string | null;
  recordedAt: Date;
  createdAt: Date;
}

export interface InventoryReturn {
  id: string;
  organizationId: string;
  communityId?: string | null;
  returnNumber: string;
  storeId: string;
  returnType: InventoryReturnType;
  workOrderId?: string | null;
  issueId?: string | null;
  status: InventoryReturnStatus;
  returnedAt: Date;
  returnedById?: string | null;
  receivedById?: string | null;
  notes?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  lines?: InventoryReturnLine[];
}

export interface InventoryReturnLine {
  id: string;
  returnId: string;
  issueLineId?: string | null;
  itemId: string;
  quantity: number;
  uomId: string;
  batchId?: string | null;
  serialId?: string | null;
  condition: string;
  binId?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface StockTransfer {
  id: string;
  organizationId: string;
  communityId?: string | null;
  transferNumber: string;
  sourceStoreId: string;
  destinationStoreId: string;
  status: StockTransferStatus;
  dispatchedAt?: Date | null;
  dispatchedById?: string | null;
  receivedAt?: Date | null;
  receivedById?: string | null;
  notes?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  lines?: StockTransferLine[];
}

export interface StockTransferLine {
  id: string;
  transferId: string;
  itemId: string;
  requestedQty: number;
  dispatchedQty: number;
  receivedQty: number;
  uomId: string;
  batchId?: string | null;
  serialIds?: string[];
  sourceBinId?: string | null;
  destinationBinId?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface StockAdjustment {
  id: string;
  organizationId: string;
  communityId?: string | null;
  adjustmentNumber: string;
  storeId: string;
  reason: StockAdjustmentReason;
  status: StockAdjustmentStatus;
  approvalInstanceId?: string | null;
  requestedById?: string | null;
  approvedById?: string | null;
  approvedAt?: Date | null;
  postedById?: string | null;
  postedAt?: Date | null;
  notes?: string | null;
  documentId?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  lines?: StockAdjustmentLine[];
}

export interface StockAdjustmentLine {
  id: string;
  adjustmentId: string;
  itemId: string;
  binId?: string | null;
  batchId?: string | null;
  serialId?: string | null;
  quantityDelta: number;
  uomId: string;
  reasonDetails?: string | null;
  createdAt: Date;
}

export interface StockCount {
  id: string;
  organizationId: string;
  communityId?: string | null;
  countNumber: string;
  storeId: string;
  countType: StockCountType;
  status: StockCountStatus;
  freezeMovements: boolean;
  startedAt?: Date | null;
  submittedAt?: Date | null;
  submittedById?: string | null;
  reviewedAt?: Date | null;
  reviewedById?: string | null;
  postedAt?: Date | null;
  postedById?: string | null;
  notes?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  lines?: StockCountLine[];
}

export interface StockCountLine {
  id: string;
  countId: string;
  itemId: string;
  binId?: string | null;
  batchId?: string | null;
  systemSnapshotQty: number;
  countedQty?: number | null;
  varianceQty?: number | null;
  uomId: string;
  notes?: string | null;
  countedById?: string | null;
  countedAt?: Date | null;
  createdAt: Date;
}

export interface InventoryKpiMetrics {
  totalItems: number;
  activeItems: number;
  stockedItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalStores: number;
  reservedItemsCount: number;
  expiringBatchesCount: number;
  pendingMaterialRequests: number;
  pendingReceipts: number;
  pendingIssues: number;
}
