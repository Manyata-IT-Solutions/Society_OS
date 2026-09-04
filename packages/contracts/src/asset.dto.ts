import type {
  Asset,
  AssetCategory,
  AssetModel,
  AssetLocationHistory,
  AssetWarranty,
  AssetServiceContract,
  AssetDowntime,
  AssetMeter,
  AssetMeterReading,
  AssetServiceRecord,
  WorkOrderAssetLink,
  AssetImportJob,
  AssetKpiMetrics,
  AssetLifecycleState,
  AssetOperationalStatus,
  AssetCondition,
  AssetCriticality,
  AssetWarrantyStatus,
  ServiceContractType,
  ServiceContractStatus,
  AssetMeterType,
  AssetMeterReadingSource,
  WorkOrderAssetRelationType,
  AssetDowntimeReason,
  AssetDowntimeImpact,
  AssetServiceRecordType,
  AssetServiceRecordSource,
  AssetImportJobStatus,
  EntityStatus,
} from '@community-os/types';

// =============================================================================
// CATEGORY DTOS
// =============================================================================

export interface AssetCategoryResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parentName?: string | null;
  status: EntityStatus;
  icon: string | null;
  defaultCriticality: AssetCriticality;
  defaultExpectedLifeYears: number | null;
  customFieldDefinitions: unknown[];
  createdAt: string;
  updatedAt: string;
}

function toSafeIsoString(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return String(val);
}

function toRequiredIsoString(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return new Date(val as string | number | Date).toISOString();
}

export function toAssetCategoryDto(
  category: AssetCategory,
  extras?: { parentName?: string | null },
): AssetCategoryResponseDto {
  return {
    id: category.id,
    organizationId: category.organizationId,
    communityId: category.communityId,
    code: category.code,
    name: category.name,
    description: category.description,
    parentId: category.parentId,
    parentName: extras?.parentName,
    status: category.status,
    icon: category.icon,
    defaultCriticality: category.defaultCriticality,
    defaultExpectedLifeYears: category.defaultExpectedLifeYears,
    customFieldDefinitions: category.customFieldDefinitions,
    createdAt:
      category.createdAt instanceof Date
        ? category.createdAt.toISOString()
        : String(category.createdAt),
    updatedAt:
      category.updatedAt instanceof Date
        ? category.updatedAt.toISOString()
        : String(category.updatedAt),
  };
}

// =============================================================================
// MODEL DTOS
// =============================================================================

export interface AssetModelResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  categoryId: string;
  categoryName?: string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  description: string | null;
  expectedLifeYears: number | null;
  specifications: Record<string, unknown>;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export function toAssetModelDto(
  model: AssetModel,
  extras?: { categoryName?: string },
): AssetModelResponseDto {
  return {
    id: model.id,
    organizationId: model.organizationId,
    communityId: model.communityId,
    categoryId: model.categoryId,
    categoryName: extras?.categoryName,
    manufacturer: model.manufacturer,
    modelName: model.modelName,
    modelNumber: model.modelNumber,
    description: model.description,
    expectedLifeYears: model.expectedLifeYears,
    specifications: model.specifications,
    status: model.status,
    createdAt:
      model.createdAt instanceof Date ? model.createdAt.toISOString() : String(model.createdAt),
    updatedAt:
      model.updatedAt instanceof Date ? model.updatedAt.toISOString() : String(model.updatedAt),
  };
}

// =============================================================================
// ASSET SUMMARY & DETAIL DTOS
// =============================================================================

export interface AssetSummaryResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  assetCode: string;
  name: string;
  description: string | null;
  assetCategoryId: string;
  categoryName?: string;
  assetModelId: string | null;
  modelName?: string;
  status: EntityStatus;
  lifecycleState: AssetLifecycleState;
  operationalStatus: AssetOperationalStatus;
  condition: AssetCondition;
  criticality: AssetCriticality;
  locationType: string;
  buildingId: string | null;
  buildingName?: string;
  floorId: string | null;
  unitId: string | null;
  unitNumber?: string;
  locationDescription: string | null;
  isMovable: boolean;
  serialNumber: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  qrIdentifier: string;
  barcodeIdentifier: string | null;
  warrantyStatus?: AssetWarrantyStatus;
  warrantyEndDate: string | null;
  nextMaintenanceDueAt: string | null;
  lastMaintenanceAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toAssetSummaryDto(
  asset: Asset,
  extras?: {
    categoryName?: string;
    modelName?: string;
    buildingName?: string;
    unitNumber?: string;
    warrantyStatus?: AssetWarrantyStatus;
  },
): AssetSummaryResponseDto {
  return {
    id: asset.id,
    organizationId: asset.organizationId,
    communityId: asset.communityId,
    assetCode: asset.assetCode,
    name: asset.name,
    description: asset.description,
    assetCategoryId: asset.assetCategoryId,
    categoryName: extras?.categoryName,
    assetModelId: asset.assetModelId,
    modelName: extras?.modelName,
    status: asset.status,
    lifecycleState: asset.lifecycleState,
    operationalStatus: asset.operationalStatus,
    condition: asset.condition,
    criticality: asset.criticality,
    locationType: asset.locationType,
    buildingId: asset.buildingId,
    buildingName: extras?.buildingName,
    floorId: asset.floorId,
    unitId: asset.unitId,
    unitNumber: extras?.unitNumber,
    locationDescription: asset.locationDescription,
    isMovable: asset.isMovable,
    serialNumber: asset.serialNumber,
    manufacturer: asset.manufacturer,
    modelNumber: asset.modelNumber,
    qrIdentifier: asset.qrIdentifier,
    barcodeIdentifier: asset.barcodeIdentifier,
    warrantyStatus: extras?.warrantyStatus,
    warrantyEndDate: toSafeIsoString(asset.warrantyEndDate),
    nextMaintenanceDueAt: toSafeIsoString(asset.nextMaintenanceDueAt),
    lastMaintenanceAt: toSafeIsoString(asset.lastMaintenanceAt),
    createdAt: toRequiredIsoString(asset.createdAt),
    updatedAt: toRequiredIsoString(asset.updatedAt),
  };
}

export interface AssetDetailResponseDto extends AssetSummaryResponseDto {
  propertySectionId: string | null;
  parentAssetId: string | null;
  parentAssetName?: string;
  purchaseDate: string | null;
  installationDate: string | null;
  commissionedAt: string | null;
  commissionedById: string | null;
  commissioningNotes: string | null;
  warrantyStartDate: string | null;
  warrantyProviderName: string | null;
  expectedLifeYears: number | null;
  decommissionedAt: string | null;
  decommissionReason: string | null;
  replacementAssetId: string | null;
  disposedAt: string | null;
  disposalReason: string | null;
  disposalMethod: string | null;
  primaryPhotoDocumentId: string | null;
  version: number;
  warranties?: AssetWarrantyResponseDto[];
  serviceContracts?: AssetServiceContractResponseDto[];
  meters?: AssetMeterResponseDto[];
  components?: AssetSummaryResponseDto[];
  openWorkOrdersCount?: number;
}

export function toAssetDetailDto(
  asset: Asset,
  extras?: {
    categoryName?: string;
    modelName?: string;
    buildingName?: string;
    unitNumber?: string;
    parentAssetName?: string;
    warrantyStatus?: AssetWarrantyStatus;
    warranties?: AssetWarrantyResponseDto[];
    serviceContracts?: AssetServiceContractResponseDto[];
    meters?: AssetMeterResponseDto[];
    components?: AssetSummaryResponseDto[];
    openWorkOrdersCount?: number;
  },
): AssetDetailResponseDto {
  const summary = toAssetSummaryDto(asset, extras);
  return {
    ...summary,
    propertySectionId: asset.propertySectionId,
    parentAssetId: asset.parentAssetId,
    parentAssetName: extras?.parentAssetName,
    purchaseDate: toSafeIsoString(asset.purchaseDate),
    installationDate: toSafeIsoString(asset.installationDate),
    commissionedAt: toSafeIsoString(asset.commissionedAt),
    commissionedById: asset.commissionedById,
    commissioningNotes: asset.commissioningNotes,
    warrantyStartDate: toSafeIsoString(asset.warrantyStartDate),
    warrantyProviderName: asset.warrantyProviderName,
    expectedLifeYears: asset.expectedLifeYears,
    decommissionedAt: toSafeIsoString(asset.decommissionedAt),
    decommissionReason: asset.decommissionReason,
    replacementAssetId: asset.replacementAssetId,
    disposedAt: toSafeIsoString(asset.disposedAt),
    disposalReason: asset.disposalReason,
    disposalMethod: asset.disposalMethod,
    primaryPhotoDocumentId: asset.primaryPhotoDocumentId,
    version: asset.version,
    warranties: extras?.warranties,
    serviceContracts: extras?.serviceContracts,
    meters: extras?.meters,
    components: extras?.components,
    openWorkOrdersCount: extras?.openWorkOrdersCount,
  };
}

// =============================================================================
// WARRANTY & CONTRACT DTOS
// =============================================================================

export interface AssetWarrantyResponseDto {
  id: string;
  assetId: string;
  warrantyType: string;
  providerName: string;
  referenceNumber: string | null;
  startDate: string;
  endDate: string;
  coverageSummary: string;
  termsDocumentId: string | null;
  status: AssetWarrantyStatus;
  createdAt: string;
  updatedAt: string;
}

export function toAssetWarrantyDto(warranty: AssetWarranty): AssetWarrantyResponseDto {
  return {
    id: warranty.id,
    assetId: warranty.assetId,
    warrantyType: warranty.warrantyType,
    providerName: warranty.providerName,
    referenceNumber: warranty.referenceNumber,
    startDate: toRequiredIsoString(warranty.startDate),
    endDate: toRequiredIsoString(warranty.endDate),
    coverageSummary: warranty.coverageSummary,
    termsDocumentId: warranty.termsDocumentId,
    status: warranty.status,
    createdAt: toRequiredIsoString(warranty.createdAt),
    updatedAt: toRequiredIsoString(warranty.updatedAt),
  };
}

export interface AssetServiceContractResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  contractNumber: string;
  name: string;
  serviceProviderName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  startDate: string;
  endDate: string;
  contractType: ServiceContractType;
  status: ServiceContractStatus;
  coverageSummary: string;
  preventiveVisitsPerYear: number;
  includesParts: boolean;
  includesLabor: boolean;
  slaResponseHours: number | null;
  termsDocumentId: string | null;
  coveredAssetsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function toAssetServiceContractDto(
  contract: AssetServiceContract,
  extras?: { coveredAssetsCount?: number },
): AssetServiceContractResponseDto {
  return {
    id: contract.id,
    organizationId: contract.organizationId,
    communityId: contract.communityId,
    contractNumber: contract.contractNumber,
    name: contract.name,
    serviceProviderName: contract.serviceProviderName,
    contactPhone: contract.contactPhone,
    contactEmail: contract.contactEmail,
    startDate: toRequiredIsoString(contract.startDate),
    endDate: toRequiredIsoString(contract.endDate),
    contractType: contract.contractType,
    status: contract.status,
    coverageSummary: contract.coverageSummary,
    preventiveVisitsPerYear: contract.preventiveVisitsPerYear,
    includesParts: contract.includesParts,
    includesLabor: contract.includesLabor,
    slaResponseHours: contract.slaResponseHours,
    termsDocumentId: contract.termsDocumentId,
    coveredAssetsCount: extras?.coveredAssetsCount,
    createdAt: toRequiredIsoString(contract.createdAt),
    updatedAt: toRequiredIsoString(contract.updatedAt),
  };
}

// =============================================================================
// METERS & READINGS DTOS
// =============================================================================

export interface AssetMeterResponseDto {
  id: string;
  assetId: string;
  meterType: AssetMeterType;
  name: string;
  unit: string;
  currentReading: number;
  lastRecordedAt: string | null;
  allowsReset: boolean;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export function toAssetMeterDto(meter: AssetMeter): AssetMeterResponseDto {
  return {
    id: meter.id,
    assetId: meter.assetId,
    meterType: meter.meterType,
    name: meter.name,
    unit: meter.unit,
    currentReading: Number(meter.currentReading),
    lastRecordedAt: toSafeIsoString(meter.lastRecordedAt),
    allowsReset: meter.allowsReset,
    status: meter.status,
    createdAt: toRequiredIsoString(meter.createdAt),
    updatedAt: toRequiredIsoString(meter.updatedAt),
  };
}

export interface AssetMeterReadingResponseDto {
  id: string;
  meterId: string;
  reading: number;
  previousReading: number | null;
  delta: number | null;
  source: AssetMeterReadingSource;
  sourceWorkOrderId: string | null;
  notes: string | null;
  documentId: string | null;
  recordedAt: string;
  recordedById: string | null;
  recordedByName?: string;
  createdAt: string;
}

export function toAssetMeterReadingDto(
  reading: AssetMeterReading,
  extras?: { recordedByName?: string },
): AssetMeterReadingResponseDto {
  return {
    id: reading.id,
    meterId: reading.meterId,
    reading: Number(reading.reading),
    previousReading: reading.previousReading !== null ? Number(reading.previousReading) : null,
    delta: reading.delta !== null ? Number(reading.delta) : null,
    source: reading.source,
    sourceWorkOrderId: reading.sourceWorkOrderId,
    notes: reading.notes,
    documentId: reading.documentId,
    recordedAt: toRequiredIsoString(reading.recordedAt),
    recordedById: reading.recordedById,
    recordedByName: extras?.recordedByName,
    createdAt: toRequiredIsoString(reading.createdAt),
  };
}

// =============================================================================
// DOWNTIME & SERVICE RECORDS DTOS
// =============================================================================

export interface AssetDowntimeResponseDto {
  id: string;
  assetId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  reason: AssetDowntimeReason;
  impactLevel: AssetDowntimeImpact;
  sourceWorkOrderId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toAssetDowntimeDto(downtime: AssetDowntime): AssetDowntimeResponseDto {
  return {
    id: downtime.id,
    assetId: downtime.assetId,
    startedAt: toRequiredIsoString(downtime.startedAt),
    endedAt: toSafeIsoString(downtime.endedAt),
    durationMinutes: downtime.durationMinutes,
    reason: downtime.reason,
    impactLevel: downtime.impactLevel,
    sourceWorkOrderId: downtime.sourceWorkOrderId,
    notes: downtime.notes,
    createdAt: toRequiredIsoString(downtime.createdAt),
    updatedAt:
      downtime.updatedAt instanceof Date
        ? downtime.updatedAt.toISOString()
        : String(downtime.updatedAt),
  };
}

export interface AssetServiceRecordResponseDto {
  id: string;
  assetId: string;
  serviceDate: string;
  serviceType: AssetServiceRecordType;
  providerName: string | null;
  summary: string;
  technicianNotes: string | null;
  workOrderId: string | null;
  documentId: string | null;
  source: AssetServiceRecordSource;
  createdAt: string;
}

export function toAssetServiceRecordDto(record: AssetServiceRecord): AssetServiceRecordResponseDto {
  return {
    id: record.id,
    assetId: record.assetId,
    serviceDate: toRequiredIsoString(record.serviceDate),
    serviceType: record.serviceType,
    providerName: record.providerName,
    summary: record.summary,
    technicianNotes: record.technicianNotes,
    workOrderId: record.workOrderId,
    documentId: record.documentId,
    source: record.source,
    createdAt: toRequiredIsoString(record.createdAt),
  };
}

export interface AssetLocationHistoryResponseDto {
  id: string;
  assetId: string;
  fromLocationType: string;
  fromLocationDescription: string | null;
  toLocationType: string;
  toLocationDescription: string | null;
  movedAt: string;
  movedById: string | null;
  movedByName?: string | null;
  reason: string | null;
  createdAt: string;
}

export function toAssetLocationHistoryDto(
  hist: AssetLocationHistory,
  extras?: { movedByName?: string },
): AssetLocationHistoryResponseDto {
  return {
    id: hist.id,
    assetId: hist.assetId,
    fromLocationType: hist.fromLocationType,
    fromLocationDescription: hist.fromLocationDescription,
    toLocationType: hist.toLocationType,
    toLocationDescription: hist.toLocationDescription,
    movedAt: toRequiredIsoString(hist.movedAt),
    movedById: hist.movedById,
    movedByName: extras?.movedByName,
    reason: hist.reason,
    createdAt: toRequiredIsoString(hist.createdAt),
  };
}

export interface WorkOrderAssetLinkResponseDto {
  id: string;
  workOrderId: string;
  assetId: string;
  assetCode?: string;
  assetName?: string;
  relationshipType: WorkOrderAssetRelationType;
  initialCondition: AssetCondition | null;
  resultingCondition: AssetCondition | null;
  notes: string | null;
  createdAt: string;
}

export function toWorkOrderAssetLinkDto(
  link: WorkOrderAssetLink,
  extras?: { assetCode?: string; assetName?: string },
): WorkOrderAssetLinkResponseDto {
  return {
    id: link.id,
    workOrderId: link.workOrderId,
    assetId: link.assetId,
    assetCode: extras?.assetCode,
    assetName: extras?.assetName,
    relationshipType: link.relationshipType,
    initialCondition: link.initialCondition,
    resultingCondition: link.resultingCondition,
    notes: link.notes,
    createdAt: toRequiredIsoString(link.createdAt),
  };
}

// =============================================================================
// SCAN & KPI DTOS
// =============================================================================

export interface AssetQrScanResultResponseDto {
  asset: AssetDetailResponseDto;
  openWorkOrders: Array<{
    id: string;
    workOrderNumber: string;
    title: string;
    priority: string;
    currentState: string;
    primaryAssigneeId?: string | null;
    primaryAssigneeName?: string | null;
  }>;
  assignedWorkForCurrentUser?: Array<{
    id: string;
    workOrderNumber: string;
    title: string;
    priority: string;
    currentState: string;
  }>;
  allowedActions: string[];
}

export interface AssetImportJobResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  fileName: string;
  status: AssetImportJobStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errorsJson: unknown[];
  createdAt: string;
  completedAt: string | null;
}

export function toAssetImportJobDto(job: AssetImportJob): AssetImportJobResponseDto {
  return {
    id: job.id,
    organizationId: job.organizationId,
    communityId: job.communityId,
    fileName: job.fileName,
    status: job.status,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    successfulRows: job.successfulRows,
    failedRows: job.failedRows,
    errorsJson: job.errorsJson,
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : String(job.createdAt),
    completedAt: toSafeIsoString(job.completedAt),
  };
}

export type AssetKpiMetricsResponseDto = AssetKpiMetrics;
