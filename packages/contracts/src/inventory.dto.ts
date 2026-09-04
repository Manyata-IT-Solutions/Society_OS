import type {
  InventoryItemType,
  StockTrackingType,
  InventoryStoreType,
  InventoryBatchStatus,
  InventorySerialStatus,
  StockTransactionType,
  StockReferenceType,
  InventoryReceiptSourceType,
  InventoryReceiptStatus,
  InventoryIssueType,
  InventoryIssueStatus,
  MaterialRequirementPriority,
  MaterialRequirementStatus,
  StockReservationStatus,
  InventoryReturnType,
  InventoryReturnStatus,
  StockTransferStatus,
  StockAdjustmentReason,
  StockAdjustmentStatus,
  StockCountType,
  StockCountStatus,
  InventoryImportJobStatus,
  EntityStatus,
} from '@community-os/types';

export function toSafeIsoString(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return String(val);
}

export function toRequiredIsoString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return String(val);
}

export function toNumeric(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return val;
  if (
    typeof val === 'object' &&
    val !== null &&
    'toNumber' in val &&
    typeof (val as any).toNumber === 'function'
  ) {
    return (val as any).toNumber();
  }
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
}

// Unit of Measure
export interface UnitOfMeasureResponseDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  symbol: string;
  precision: number;
  isBase: boolean;
  baseUomId: string | null;
  conversionFactor: number;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export function toUnitOfMeasureDto(entity: any): UnitOfMeasureResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    code: entity.code,
    name: entity.name,
    symbol: entity.symbol,
    precision: entity.precision,
    isBase: entity.isBase,
    baseUomId: entity.baseUomId ?? null,
    conversionFactor: toNumeric(entity.conversionFactor, 1),
    status: entity.status,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Category
export interface InventoryCategoryResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parentName?: string | null;
  status: EntityStatus;
  customFieldDefinitions: any[];
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function toInventoryCategoryDto(entity: any): InventoryCategoryResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    code: entity.code,
    name: entity.name,
    description: entity.description ?? null,
    parentId: entity.parentId ?? null,
    parentName: entity.parent?.name ?? null,
    status: entity.status,
    customFieldDefinitions: (entity.customFieldDefinitions as any[]) ?? [],
    itemCount: entity._count?.items ?? undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Store
export interface InventoryStoreResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  code: string;
  name: string;
  description: string | null;
  storeType: InventoryStoreType;
  propertySectionId: string | null;
  propertySectionName?: string | null;
  buildingId: string | null;
  buildingName?: string | null;
  locationDescription: string | null;
  status: EntityStatus;
  managerUserId: string | null;
  managerUserName?: string | null;
  version: number;
  binCount?: number;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function toInventoryStoreDto(entity: any): InventoryStoreResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    code: entity.code,
    name: entity.name,
    description: entity.description ?? null,
    storeType: entity.storeType,
    propertySectionId: entity.propertySectionId ?? null,
    propertySectionName: entity.propertySection?.name ?? null,
    buildingId: entity.buildingId ?? null,
    buildingName: entity.building?.name ?? null,
    locationDescription: entity.locationDescription ?? null,
    status: entity.status,
    managerUserId: entity.managerUserId ?? null,
    managerUserName: entity.managerUser?.displayName ?? null,
    version: entity.version ?? 1,
    binCount: entity._count?.bins ?? undefined,
    itemCount: entity._count?.balances ?? undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Stock Bin
export interface StockBinResponseDto {
  id: string;
  storeId: string;
  storeName?: string | null;
  code: string;
  name: string;
  rack: string | null;
  shelf: string | null;
  bin: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export function toStockBinDto(entity: any): StockBinResponseDto {
  return {
    id: entity.id,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    code: entity.code,
    name: entity.name,
    rack: entity.rack ?? null,
    shelf: entity.shelf ?? null,
    bin: entity.bin ?? null,
    status: entity.status,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Item Store Policy
export interface ItemStorePolicyResponseDto {
  id: string;
  itemId: string;
  storeId: string;
  storeName?: string | null;
  storeCode?: string | null;
  minQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  maxQuantity: number | null;
  defaultBinId: string | null;
  defaultBinCode?: string | null;
  reorderEnabled: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function toItemStorePolicyDto(entity: any): ItemStorePolicyResponseDto {
  return {
    id: entity.id,
    itemId: entity.itemId,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    storeCode: entity.store?.code ?? null,
    minQuantity: toNumeric(entity.minQuantity, 0),
    reorderLevel: toNumeric(entity.reorderLevel, 0),
    reorderQuantity: toNumeric(entity.reorderQuantity, 0),
    maxQuantity:
      entity.maxQuantity !== null && entity.maxQuantity !== undefined
        ? toNumeric(entity.maxQuantity)
        : null,
    defaultBinId: entity.defaultBinId ?? null,
    defaultBinCode: entity.defaultBin?.code ?? null,
    reorderEnabled: entity.reorderEnabled ?? true,
    version: entity.version ?? 1,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Item Master
export interface InventoryItemResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  itemCode: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName?: string | null;
  itemType: InventoryItemType;
  baseUomId: string;
  baseUomCode?: string | null;
  baseUomName?: string | null;
  defaultIssueUomId: string | null;
  defaultIssueUomCode?: string | null;
  status: EntityStatus;
  stockTrackingType: StockTrackingType;
  isBatchTracked: boolean;
  isSerialTracked: boolean;
  isExpiryTracked: boolean;
  minStockLevel: number | null;
  reorderLevel: number | null;
  maxStockLevel: number | null;
  preferredStoreId: string | null;
  preferredStoreName?: string | null;
  preferredBinId: string | null;
  preferredBinCode?: string | null;
  barcodeIdentifier: string | null;
  qrIdentifier: string | null;
  customFields: Record<string, any>;
  version: number;
  totalOnHand?: number;
  totalReserved?: number;
  totalAvailable?: number;
  storePolicies?: ItemStorePolicyResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toInventoryItemDto(entity: any): InventoryItemResponseDto {
  let totalOnHand = 0;
  let totalReserved = 0;
  let totalAvailable = 0;
  if (Array.isArray(entity.balances)) {
    for (const b of entity.balances) {
      totalOnHand += toNumeric(b.quantityOnHand, 0);
      totalReserved += toNumeric(b.quantityReserved, 0);
      totalAvailable += toNumeric(b.quantityAvailable, 0);
    }
  }

  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    itemCode: entity.itemCode,
    name: entity.name,
    description: entity.description ?? null,
    categoryId: entity.categoryId,
    categoryName: entity.category?.name ?? null,
    itemType: entity.itemType,
    baseUomId: entity.baseUomId,
    baseUomCode: entity.baseUom?.code ?? null,
    baseUomName: entity.baseUom?.name ?? null,
    defaultIssueUomId: entity.defaultIssueUomId ?? null,
    defaultIssueUomCode: entity.defaultIssueUom?.code ?? null,
    status: entity.status,
    stockTrackingType: entity.stockTrackingType,
    isBatchTracked: entity.isBatchTracked ?? false,
    isSerialTracked: entity.isSerialTracked ?? false,
    isExpiryTracked: entity.isExpiryTracked ?? false,
    minStockLevel:
      entity.minStockLevel !== null && entity.minStockLevel !== undefined
        ? toNumeric(entity.minStockLevel)
        : null,
    reorderLevel:
      entity.reorderLevel !== null && entity.reorderLevel !== undefined
        ? toNumeric(entity.reorderLevel)
        : null,
    maxStockLevel:
      entity.maxStockLevel !== null && entity.maxStockLevel !== undefined
        ? toNumeric(entity.maxStockLevel)
        : null,
    preferredStoreId: entity.preferredStoreId ?? null,
    preferredStoreName: entity.preferredStore?.name ?? null,
    preferredBinId: entity.preferredBinId ?? null,
    preferredBinCode: entity.preferredBin?.code ?? null,
    barcodeIdentifier: entity.barcodeIdentifier ?? null,
    qrIdentifier: entity.qrIdentifier ?? null,
    customFields: (entity.customFields as Record<string, any>) ?? {},
    version: entity.version ?? 1,
    totalOnHand: Array.isArray(entity.balances) ? totalOnHand : undefined,
    totalReserved: Array.isArray(entity.balances) ? totalReserved : undefined,
    totalAvailable: Array.isArray(entity.balances) ? totalAvailable : undefined,
    storePolicies: Array.isArray(entity.storePolicies)
      ? entity.storePolicies.map(toItemStorePolicyDto)
      : undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Stock Balance
export interface StockBalanceResponseDto {
  id: string;
  storeId: string;
  storeName?: string | null;
  storeCode?: string | null;
  binId: string | null;
  binCode?: string | null;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  version: number;
  lastMovementAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toStockBalanceDto(entity: any): StockBalanceResponseDto {
  return {
    id: entity.id,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    storeCode: entity.store?.code ?? null,
    binId: entity.binId ?? null,
    binCode: entity.bin?.code ?? null,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    expiryDate: toSafeIsoString(entity.batch?.expiryAt),
    quantityOnHand: toNumeric(entity.quantityOnHand, 0),
    quantityReserved: toNumeric(entity.quantityReserved, 0),
    quantityAvailable: toNumeric(entity.quantityAvailable, 0),
    version: entity.version ?? 1,
    lastMovementAt: toSafeIsoString(entity.lastMovementAt),
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Stock Ledger Entry
export interface StockLedgerEntryResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  storeId: string;
  storeName?: string | null;
  binId: string | null;
  binCode?: string | null;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  serialId: string | null;
  serialNumber?: string | null;
  transactionType: StockTransactionType;
  quantityDelta: number;
  uom: string;
  referenceType: StockReferenceType;
  referenceId: string | null;
  occurredAt: string;
  createdById: string | null;
  createdByName?: string | null;
  idempotencyKey: string | null;
  notes: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export function toStockLedgerEntryDto(entity: any): StockLedgerEntryResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    binId: entity.binId ?? null,
    binCode: entity.bin?.code ?? null,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    serialId: entity.serialId ?? null,
    serialNumber: entity.serial?.serialNumber ?? null,
    transactionType: entity.transactionType,
    quantityDelta: toNumeric(entity.quantityDelta, 0),
    uom: entity.uom,
    referenceType: entity.referenceType,
    referenceId: entity.referenceId ?? null,
    occurredAt: toRequiredIsoString(entity.occurredAt),
    createdById: entity.createdById ?? null,
    createdByName: entity.createdByUser?.displayName ?? null,
    idempotencyKey: entity.idempotencyKey ?? null,
    notes: entity.notes ?? null,
    metadata: (entity.metadata as Record<string, any>) ?? null,
    createdAt: toRequiredIsoString(entity.createdAt),
  };
}

// Goods Receipt
export interface InventoryReceiptLineResponseDto {
  id: string;
  receiptId: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  quantity: number;
  uomId: string;
  uomCode?: string | null;
  unitPrice: number | null;
  batchNumber: string | null;
  expiryDate: string | null;
  serialNumbers: string[];
  binId: string | null;
  binCode?: string | null;
  batchId: string | null;
  notes: string | null;
  createdAt: string;
}

export function toInventoryReceiptLineDto(entity: any): InventoryReceiptLineResponseDto {
  return {
    id: entity.id,
    receiptId: entity.receiptId,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    quantity: toNumeric(entity.quantity, 0),
    uomId: entity.uomId,
    uomCode: entity.uom?.code ?? null,
    unitPrice:
      entity.unitPrice !== null && entity.unitPrice !== undefined
        ? toNumeric(entity.unitPrice)
        : null,
    batchNumber: entity.batchNumber ?? null,
    expiryDate: toSafeIsoString(entity.expiryDate),
    serialNumbers: (entity.serialNumbers as string[]) ?? [],
    binId: entity.binId ?? null,
    binCode: entity.bin?.code ?? null,
    batchId: entity.batchId ?? null,
    notes: entity.notes ?? null,
    createdAt: toRequiredIsoString(entity.createdAt),
  };
}

export interface InventoryReceiptResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  receiptNumber: string;
  storeId: string;
  storeName?: string | null;
  sourceType: InventoryReceiptSourceType;
  sourceReference: string | null;
  supplierName: string | null;
  status: InventoryReceiptStatus;
  receivedAt: string;
  receivedById: string | null;
  receivedByName?: string | null;
  notes: string | null;
  documentId: string | null;
  version: number;
  lines?: InventoryReceiptLineResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toInventoryReceiptDto(entity: any): InventoryReceiptResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    receiptNumber: entity.receiptNumber,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    sourceType: entity.sourceType,
    sourceReference: entity.sourceReference ?? null,
    supplierName: entity.supplierName ?? null,
    status: entity.status,
    receivedAt: toRequiredIsoString(entity.receivedAt),
    receivedById: entity.receivedById ?? null,
    receivedByName: entity.receivedByUser?.displayName ?? null,
    notes: entity.notes ?? null,
    documentId: entity.documentId ?? null,
    version: entity.version ?? 1,
    lines: Array.isArray(entity.lines) ? entity.lines.map(toInventoryReceiptLineDto) : undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Material Issue
export interface InventoryIssueLineResponseDto {
  id: string;
  issueId: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  requirementId: string | null;
  requestedQty: number;
  approvedQty: number | null;
  issuedQty: number;
  returnedQty: number;
  consumedQty: number;
  outstandingQty: number;
  uomId: string;
  uomCode?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  serialIds: string[];
  binId: string | null;
  binCode?: string | null;
  notes: string | null;
  createdAt: string;
}

export function toInventoryIssueLineDto(entity: any): InventoryIssueLineResponseDto {
  const issued = toNumeric(entity.issuedQty, 0);
  const returned = toNumeric(entity.returnedQty, 0);
  const consumed = toNumeric(entity.consumedQty, 0);
  const outstanding = Math.max(0, issued - returned - consumed);

  return {
    id: entity.id,
    issueId: entity.issueId,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    requirementId: entity.requirementId ?? null,
    requestedQty: toNumeric(entity.requestedQty, 0),
    approvedQty:
      entity.approvedQty !== null && entity.approvedQty !== undefined
        ? toNumeric(entity.approvedQty)
        : null,
    issuedQty: issued,
    returnedQty: returned,
    consumedQty: consumed,
    outstandingQty: outstanding,
    uomId: entity.uomId,
    uomCode: entity.uom?.code ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    serialIds: (entity.serialIds as string[]) ?? [],
    binId: entity.binId ?? null,
    binCode: entity.bin?.code ?? null,
    notes: entity.notes ?? null,
    createdAt: toRequiredIsoString(entity.createdAt),
  };
}

export interface InventoryIssueResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  issueNumber: string;
  storeId: string;
  storeName?: string | null;
  issueType: InventoryIssueType;
  workOrderId: string | null;
  workOrderNumber?: string | null;
  workOrderTitle?: string | null;
  issuedToUserId: string | null;
  issuedToUserName?: string | null;
  issuedToTeamId: string | null;
  status: InventoryIssueStatus;
  requestedAt: string | null;
  requestedById: string | null;
  requestedByName?: string | null;
  approvedById: string | null;
  approvedByName?: string | null;
  approvedAt: string | null;
  issuedAt: string | null;
  issuedById: string | null;
  issuedByName?: string | null;
  notes: string | null;
  version: number;
  lines?: InventoryIssueLineResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toInventoryIssueDto(entity: any): InventoryIssueResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    issueNumber: entity.issueNumber,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    issueType: entity.issueType,
    workOrderId: entity.workOrderId ?? null,
    workOrderNumber: entity.workOrder?.workOrderNumber ?? null,
    workOrderTitle: entity.workOrder?.title ?? null,
    issuedToUserId: entity.issuedToUserId ?? null,
    issuedToUserName: entity.issuedToUser?.displayName ?? null,
    issuedToTeamId: entity.issuedToTeamId ?? null,
    status: entity.status,
    requestedAt: toSafeIsoString(entity.requestedAt),
    requestedById: entity.requestedById ?? null,
    requestedByName: entity.requestedByUser?.displayName ?? null,
    approvedById: entity.approvedById ?? null,
    approvedByName: entity.approvedByUser?.displayName ?? null,
    approvedAt: toSafeIsoString(entity.approvedAt),
    issuedAt: toSafeIsoString(entity.issuedAt),
    issuedById: entity.issuedById ?? null,
    issuedByName: entity.issuedByUser?.displayName ?? null,
    notes: entity.notes ?? null,
    version: entity.version ?? 1,
    lines: Array.isArray(entity.lines) ? entity.lines.map(toInventoryIssueLineDto) : undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Work Order Material Requirement
export interface WorkOrderMaterialRequirementResponseDto {
  id: string;
  workOrderId: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  requiredQty: number;
  reservedQty: number;
  issuedQty: number;
  consumedQty: number;
  returnedQty: number;
  uomId: string;
  uomCode?: string | null;
  priority: MaterialRequirementPriority;
  status: MaterialRequirementStatus;
  preferredStoreId: string | null;
  preferredStoreName?: string | null;
  notes: string | null;
  requestedById: string | null;
  requestedByName?: string | null;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
}

export function toWorkOrderMaterialRequirementDto(
  entity: any,
): WorkOrderMaterialRequirementResponseDto {
  return {
    id: entity.id,
    workOrderId: entity.workOrderId,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    requiredQty: toNumeric(entity.requiredQty, 0),
    reservedQty: toNumeric(entity.reservedQty, 0),
    issuedQty: toNumeric(entity.issuedQty, 0),
    consumedQty: toNumeric(entity.consumedQty, 0),
    returnedQty: toNumeric(entity.returnedQty, 0),
    uomId: entity.uomId,
    uomCode: entity.uom?.code ?? null,
    priority: entity.priority,
    status: entity.status,
    preferredStoreId: entity.preferredStoreId ?? null,
    preferredStoreName: entity.preferredStore?.name ?? null,
    notes: entity.notes ?? null,
    requestedById: entity.requestedById ?? null,
    requestedByName: entity.requestedByUser?.displayName ?? null,
    requestedAt: toRequiredIsoString(entity.requestedAt),
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Stock Reservation
export interface StockReservationResponseDto {
  id: string;
  storeId: string;
  storeName?: string | null;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  workOrderId: string;
  workOrderNumber?: string | null;
  requirementId: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  quantity: number;
  status: StockReservationStatus;
  expiresAt: string | null;
  createdById: string | null;
  releasedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function toStockReservationDto(entity: any): StockReservationResponseDto {
  return {
    id: entity.id,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    workOrderId: entity.workOrderId,
    workOrderNumber: entity.workOrder?.workOrderNumber ?? null,
    requirementId: entity.requirementId ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    quantity: toNumeric(entity.quantity, 0),
    status: entity.status,
    expiresAt: toSafeIsoString(entity.expiresAt),
    createdById: entity.createdById ?? null,
    releasedAt: toSafeIsoString(entity.releasedAt),
    version: entity.version ?? 1,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Material Consumption
export interface WorkOrderMaterialConsumptionResponseDto {
  id: string;
  workOrderId: string;
  issueLineId: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  assetId: string | null;
  assetName?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  serialId: string | null;
  serialNumber?: string | null;
  quantity: number;
  uomId: string;
  uomCode?: string | null;
  notes: string | null;
  recordedById: string | null;
  recordedByName?: string | null;
  recordedAt: string;
  createdAt: string;
}

export function toWorkOrderMaterialConsumptionDto(
  entity: any,
): WorkOrderMaterialConsumptionResponseDto {
  return {
    id: entity.id,
    workOrderId: entity.workOrderId,
    issueLineId: entity.issueLineId,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    assetId: entity.assetId ?? null,
    assetName: entity.asset?.name ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    serialId: entity.serialId ?? null,
    serialNumber: entity.serial?.serialNumber ?? null,
    quantity: toNumeric(entity.quantity, 0),
    uomId: entity.uomId,
    uomCode: entity.uom?.code ?? null,
    notes: entity.notes ?? null,
    recordedById: entity.recordedById ?? null,
    recordedByName: entity.recordedByUser?.displayName ?? null,
    recordedAt: toRequiredIsoString(entity.recordedAt),
    createdAt: toRequiredIsoString(entity.createdAt),
  };
}

// Material Return
export interface InventoryReturnLineResponseDto {
  id: string;
  returnId: string;
  issueLineId: string | null;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  quantity: number;
  uomId: string;
  uomCode?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  serialId: string | null;
  serialNumber?: string | null;
  condition: string;
  binId: string | null;
  binCode?: string | null;
  notes: string | null;
  createdAt: string;
}

export function toInventoryReturnLineDto(entity: any): InventoryReturnLineResponseDto {
  return {
    id: entity.id,
    returnId: entity.returnId,
    issueLineId: entity.issueLineId ?? null,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    quantity: toNumeric(entity.quantity, 0),
    uomId: entity.uomId,
    uomCode: entity.uom?.code ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    serialId: entity.serialId ?? null,
    serialNumber: entity.serial?.serialNumber ?? null,
    condition: entity.condition,
    binId: entity.binId ?? null,
    binCode: entity.bin?.code ?? null,
    notes: entity.notes ?? null,
    createdAt: toRequiredIsoString(entity.createdAt),
  };
}

export interface InventoryReturnResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  returnNumber: string;
  storeId: string;
  storeName?: string | null;
  returnType: InventoryReturnType;
  workOrderId: string | null;
  issueId: string | null;
  status: InventoryReturnStatus;
  returnedAt: string;
  returnedById: string | null;
  returnedByName?: string | null;
  receivedById: string | null;
  receivedByName?: string | null;
  notes: string | null;
  version: number;
  lines?: InventoryReturnLineResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toInventoryReturnDto(entity: any): InventoryReturnResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    returnNumber: entity.returnNumber,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    returnType: entity.returnType,
    workOrderId: entity.workOrderId ?? null,
    issueId: entity.issueId ?? null,
    status: entity.status,
    returnedAt: toRequiredIsoString(entity.returnedAt),
    returnedById: entity.returnedById ?? null,
    returnedByName: entity.returnedByUser?.displayName ?? null,
    receivedById: entity.receivedById ?? null,
    receivedByName: entity.receivedByUser?.displayName ?? null,
    notes: entity.notes ?? null,
    version: entity.version ?? 1,
    lines: Array.isArray(entity.lines) ? entity.lines.map(toInventoryReturnLineDto) : undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Stock Transfer
export interface StockTransferLineResponseDto {
  id: string;
  transferId: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  requestedQty: number;
  dispatchedQty: number;
  receivedQty: number;
  uomId: string;
  uomCode?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  serialIds: string[];
  sourceBinId: string | null;
  sourceBinCode?: string | null;
  destinationBinId: string | null;
  destinationBinCode?: string | null;
  notes: string | null;
  createdAt: string;
}

export function toStockTransferLineDto(entity: any): StockTransferLineResponseDto {
  return {
    id: entity.id,
    transferId: entity.transferId,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    requestedQty: toNumeric(entity.requestedQty, 0),
    dispatchedQty: toNumeric(entity.dispatchedQty, 0),
    receivedQty: toNumeric(entity.receivedQty, 0),
    uomId: entity.uomId,
    uomCode: entity.uom?.code ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    serialIds: (entity.serialIds as string[]) ?? [],
    sourceBinId: entity.sourceBinId ?? null,
    sourceBinCode: entity.sourceBin?.code ?? null,
    destinationBinId: entity.destinationBinId ?? null,
    destinationBinCode: entity.destinationBin?.code ?? null,
    notes: entity.notes ?? null,
    createdAt: toRequiredIsoString(entity.createdAt),
  };
}

export interface StockTransferResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  transferNumber: string;
  sourceStoreId: string;
  sourceStoreName?: string | null;
  destinationStoreId: string;
  destinationStoreName?: string | null;
  status: StockTransferStatus;
  dispatchedAt: string | null;
  dispatchedById: string | null;
  dispatchedByName?: string | null;
  receivedAt: string | null;
  receivedById: string | null;
  receivedByName?: string | null;
  notes: string | null;
  version: number;
  lines?: StockTransferLineResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toStockTransferDto(entity: any): StockTransferResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    transferNumber: entity.transferNumber,
    sourceStoreId: entity.sourceStoreId,
    sourceStoreName: entity.sourceStore?.name ?? null,
    destinationStoreId: entity.destinationStoreId,
    destinationStoreName: entity.destinationStore?.name ?? null,
    status: entity.status,
    dispatchedAt: toSafeIsoString(entity.dispatchedAt),
    dispatchedById: entity.dispatchedById ?? null,
    dispatchedByName: entity.dispatchedByUser?.displayName ?? null,
    receivedAt: toSafeIsoString(entity.receivedAt),
    receivedById: entity.receivedById ?? null,
    receivedByName: entity.receivedByUser?.displayName ?? null,
    notes: entity.notes ?? null,
    version: entity.version ?? 1,
    lines: Array.isArray(entity.lines) ? entity.lines.map(toStockTransferLineDto) : undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Stock Adjustment
export interface StockAdjustmentLineResponseDto {
  id: string;
  adjustmentId: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  binId: string | null;
  binCode?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  serialId: string | null;
  serialNumber?: string | null;
  quantityDelta: number;
  uomId: string;
  uomCode?: string | null;
  reasonDetails: string | null;
  createdAt: string;
}

export function toStockAdjustmentLineDto(entity: any): StockAdjustmentLineResponseDto {
  return {
    id: entity.id,
    adjustmentId: entity.adjustmentId,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    binId: entity.binId ?? null,
    binCode: entity.bin?.code ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    serialId: entity.serialId ?? null,
    serialNumber: entity.serial?.serialNumber ?? null,
    quantityDelta: toNumeric(entity.quantityDelta, 0),
    uomId: entity.uomId,
    uomCode: entity.uom?.code ?? null,
    reasonDetails: entity.reasonDetails ?? null,
    createdAt: toRequiredIsoString(entity.createdAt),
  };
}

export interface StockAdjustmentResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  adjustmentNumber: string;
  storeId: string;
  storeName?: string | null;
  reason: StockAdjustmentReason;
  status: StockAdjustmentStatus;
  approvalInstanceId: string | null;
  requestedById: string | null;
  requestedByName?: string | null;
  approvedById: string | null;
  approvedByName?: string | null;
  approvedAt: string | null;
  postedById: string | null;
  postedByName?: string | null;
  postedAt: string | null;
  notes: string | null;
  documentId: string | null;
  version: number;
  lines?: StockAdjustmentLineResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toStockAdjustmentDto(entity: any): StockAdjustmentResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    adjustmentNumber: entity.adjustmentNumber,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    reason: entity.reason,
    status: entity.status,
    approvalInstanceId: entity.approvalInstanceId ?? null,
    requestedById: entity.requestedById ?? null,
    requestedByName: entity.requestedByUser?.displayName ?? null,
    approvedById: entity.approvedById ?? null,
    approvedByName: entity.approvedByUser?.displayName ?? null,
    approvedAt: toSafeIsoString(entity.approvedAt),
    postedById: entity.postedById ?? null,
    postedByName: entity.postedByUser?.displayName ?? null,
    postedAt: toSafeIsoString(entity.postedAt),
    notes: entity.notes ?? null,
    documentId: entity.documentId ?? null,
    version: entity.version ?? 1,
    lines: Array.isArray(entity.lines) ? entity.lines.map(toStockAdjustmentLineDto) : undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Stock Count
export interface StockCountLineResponseDto {
  id: string;
  countId: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  binId: string | null;
  binCode?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  systemSnapshotQty: number;
  countedQty: number | null;
  varianceQty: number | null;
  uomId: string;
  uomCode?: string | null;
  notes: string | null;
  countedById: string | null;
  countedByName?: string | null;
  countedAt: string | null;
  createdAt: string;
}

export function toStockCountLineDto(entity: any): StockCountLineResponseDto {
  return {
    id: entity.id,
    countId: entity.countId,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    binId: entity.binId ?? null,
    binCode: entity.bin?.code ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    systemSnapshotQty: toNumeric(entity.systemSnapshotQty, 0),
    countedQty:
      entity.countedQty !== null && entity.countedQty !== undefined
        ? toNumeric(entity.countedQty)
        : null,
    varianceQty:
      entity.varianceQty !== null && entity.varianceQty !== undefined
        ? toNumeric(entity.varianceQty)
        : null,
    uomId: entity.uomId,
    uomCode: entity.uom?.code ?? null,
    notes: entity.notes ?? null,
    countedById: entity.countedById ?? null,
    countedByName: entity.countedByUser?.displayName ?? null,
    countedAt: toSafeIsoString(entity.countedAt),
    createdAt: toRequiredIsoString(entity.createdAt),
  };
}

export interface StockCountResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  countNumber: string;
  storeId: string;
  storeName?: string | null;
  countType: StockCountType;
  status: StockCountStatus;
  freezeMovements: boolean;
  startedAt: string | null;
  submittedAt: string | null;
  submittedById: string | null;
  submittedByName?: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedByName?: string | null;
  postedAt: string | null;
  postedById: string | null;
  postedByName?: string | null;
  notes: string | null;
  version: number;
  totalLines?: number;
  lines?: StockCountLineResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export function toStockCountDto(entity: any): StockCountResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    countNumber: entity.countNumber,
    storeId: entity.storeId,
    storeName: entity.store?.name ?? null,
    countType: entity.countType,
    status: entity.status,
    freezeMovements: entity.freezeMovements ?? false,
    startedAt: toSafeIsoString(entity.startedAt),
    submittedAt: toSafeIsoString(entity.submittedAt),
    submittedById: entity.submittedById ?? null,
    submittedByName: entity.submittedByUser?.displayName ?? null,
    reviewedAt: toSafeIsoString(entity.reviewedAt),
    reviewedById: entity.reviewedById ?? null,
    reviewedByName: entity.reviewedByUser?.displayName ?? null,
    postedAt: toSafeIsoString(entity.postedAt),
    postedById: entity.postedById ?? null,
    postedByName: entity.postedByUser?.displayName ?? null,
    notes: entity.notes ?? null,
    version: entity.version ?? 1,
    totalLines: Array.isArray(entity.lines) ? entity.lines.length : entity._count?.lines,
    lines: Array.isArray(entity.lines) ? entity.lines.map(toStockCountLineDto) : undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Batch / Lot
export interface InventoryBatchResponseDto {
  id: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  batchNumber: string;
  manufacturedAt: string | null;
  expiryAt: string | null;
  supplierName: string | null;
  status: InventoryBatchStatus;
  notes: string | null;
  createdById: string | null;
  totalOnHand?: number;
  totalAvailable?: number;
  createdAt: string;
  updatedAt: string;
}

export function toInventoryBatchDto(entity: any): InventoryBatchResponseDto {
  let totalOnHand = 0;
  let totalAvailable = 0;
  if (Array.isArray(entity.balances)) {
    for (const b of entity.balances) {
      totalOnHand += toNumeric(b.quantityOnHand, 0);
      totalAvailable += toNumeric(b.quantityAvailable, 0);
    }
  }

  return {
    id: entity.id,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    batchNumber: entity.batchNumber,
    manufacturedAt: toSafeIsoString(entity.manufacturedAt),
    expiryAt: toSafeIsoString(entity.expiryAt),
    supplierName: entity.supplierName ?? null,
    status: entity.status,
    notes: entity.notes ?? null,
    createdById: entity.createdById ?? null,
    totalOnHand: Array.isArray(entity.balances) ? totalOnHand : undefined,
    totalAvailable: Array.isArray(entity.balances) ? totalAvailable : undefined,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Serial
export interface InventorySerialResponseDto {
  id: string;
  itemId: string;
  itemCode?: string | null;
  itemName?: string | null;
  serialNumber: string;
  status: InventorySerialStatus;
  currentStoreId: string | null;
  currentStoreName?: string | null;
  currentBinId: string | null;
  currentBinCode?: string | null;
  currentWorkOrderId: string | null;
  currentWorkOrderNumber?: string | null;
  batchId: string | null;
  batchNumber?: string | null;
  assetId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toInventorySerialDto(entity: any): InventorySerialResponseDto {
  return {
    id: entity.id,
    itemId: entity.itemId,
    itemCode: entity.item?.itemCode ?? null,
    itemName: entity.item?.name ?? null,
    serialNumber: entity.serialNumber,
    status: entity.status,
    currentStoreId: entity.currentStoreId ?? null,
    currentStoreName: entity.currentStore?.name ?? null,
    currentBinId: entity.currentBinId ?? null,
    currentBinCode: entity.currentBin?.code ?? null,
    currentWorkOrderId: entity.currentWorkOrderId ?? null,
    currentWorkOrderNumber: entity.currentWorkOrder?.workOrderNumber ?? null,
    batchId: entity.batchId ?? null,
    batchNumber: entity.batch?.batchNumber ?? null,
    assetId: entity.assetId ?? null,
    createdById: entity.createdById ?? null,
    createdAt: toRequiredIsoString(entity.createdAt),
    updatedAt: toRequiredIsoString(entity.updatedAt),
  };
}

// Import Job
export interface InventoryImportJobResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  importType: string;
  fileName: string;
  status: InventoryImportJobStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errorsJson: any[];
  createdById: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function toInventoryImportJobDto(entity: any): InventoryImportJobResponseDto {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    communityId: entity.communityId ?? null,
    importType: entity.importType,
    fileName: entity.fileName,
    status: entity.status,
    totalRows: entity.totalRows ?? 0,
    processedRows: entity.processedRows ?? 0,
    successfulRows: entity.successfulRows ?? 0,
    failedRows: entity.failedRows ?? 0,
    errorsJson: (entity.errorsJson as any[]) ?? [],
    createdById: entity.createdById ?? null,
    createdAt: toRequiredIsoString(entity.createdAt),
    completedAt: toSafeIsoString(entity.completedAt),
  };
}

// KPI Metrics
export interface InventoryKpiMetricsResponseDto {
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
