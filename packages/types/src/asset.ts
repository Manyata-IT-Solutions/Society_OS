/**
 * Enterprise Asset Management Domain Types (Phase 10)
 */

import type { EntityStatus } from './domain.js';
import type { WorkOrderLocationType } from './facility.js';

export type AssetLifecycleState =
  | 'REGISTERED'
  | 'INSTALLED'
  | 'COMMISSIONED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DECOMMISSIONED'
  | 'DISPOSED';

export type AssetOperationalStatus =
  'OPERATIONAL' | 'DEGRADED' | 'OUT_OF_SERVICE' | 'UNDER_MAINTENANCE' | 'UNKNOWN';

export type AssetCondition = 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'UNKNOWN';

export type AssetCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AssetWarrantyStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'VOID';

export type ServiceContractType = 'AMC' | 'CMC' | 'WARRANTY_SERVICE' | 'ON_CALL' | 'OTHER';

export type ServiceContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TERMINATED';

export type AssetMeterType =
  'RUN_HOURS' | 'CYCLES' | 'KWH' | 'KM' | 'PRESSURE' | 'TEMPERATURE' | 'CUSTOM';

export type AssetMeterReadingSource = 'MANUAL' | 'WORK_ORDER' | 'IMPORT' | 'IOT';

export type WorkOrderAssetRelationType = 'PRIMARY_ASSET' | 'RELATED_ASSET' | 'COMPONENT';

export type AssetDowntimeReason =
  'BREAKDOWN' | 'EMERGENCY_REPAIR' | 'SCHEDULED_MAINTENANCE' | 'POWER_OUTAGE' | 'OTHER';

export type AssetDowntimeImpact = 'FULL_OUTAGE' | 'PARTIAL_DEGRADATION' | 'NO_IMPACT';

export type AssetServiceRecordType =
  'CORRECTIVE' | 'PREVENTIVE' | 'INSPECTION' | 'OVERHAUL' | 'COMMISSIONING';

export type AssetServiceRecordSource = 'WORK_ORDER' | 'MANUAL_ENTRY' | 'IMPORT';

export type AssetImportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// =============================================================================
// DOMAIN INTERFACES
// =============================================================================

export interface AssetCategory {
  id: string;
  organizationId: string;
  communityId: string | null;
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  status: EntityStatus;
  icon: string | null;
  defaultCriticality: AssetCriticality;
  defaultExpectedLifeYears: number | null;
  customFieldDefinitions: unknown[];
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetModel {
  id: string;
  organizationId: string;
  communityId: string | null;
  categoryId: string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  description: string | null;
  expectedLifeYears: number | null;
  specifications: Record<string, unknown>;
  status: EntityStatus;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  organizationId: string;
  communityId: string;
  assetCode: string;
  name: string;
  description: string | null;
  assetCategoryId: string;
  assetModelId: string | null;
  status: EntityStatus;
  lifecycleState: AssetLifecycleState;
  operationalStatus: AssetOperationalStatus;
  condition: AssetCondition;
  criticality: AssetCriticality;
  locationType: WorkOrderLocationType;
  propertySectionId: string | null;
  buildingId: string | null;
  floorId: string | null;
  unitId: string | null;
  locationDescription: string | null;
  parentAssetId: string | null;
  isMovable: boolean;
  serialNumber: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  purchaseDate: Date | null;
  installationDate: Date | null;
  commissionedAt: Date | null;
  commissionedById: string | null;
  commissioningNotes: string | null;
  warrantyStartDate: Date | null;
  warrantyEndDate: Date | null;
  warrantyProviderName: string | null;
  expectedLifeYears: number | null;
  decommissionedAt: Date | null;
  decommissionedById: string | null;
  decommissionReason: string | null;
  replacementAssetId: string | null;
  disposedAt: Date | null;
  disposedById: string | null;
  disposalReason: string | null;
  disposalMethod: string | null;
  qrIdentifier: string;
  barcodeIdentifier: string | null;
  primaryPhotoDocumentId: string | null;
  nextMaintenanceDueAt: Date | null;
  lastMaintenanceAt: Date | null;
  version: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetLocationHistory {
  id: string;
  assetId: string;
  fromLocationType: WorkOrderLocationType;
  fromSectionId: string | null;
  fromBuildingId: string | null;
  fromFloorId: string | null;
  fromUnitId: string | null;
  fromLocationDescription: string | null;
  toLocationType: WorkOrderLocationType;
  toSectionId: string | null;
  toBuildingId: string | null;
  toFloorId: string | null;
  toUnitId: string | null;
  toLocationDescription: string | null;
  movedAt: Date;
  movedById: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface AssetWarranty {
  id: string;
  assetId: string;
  warrantyType: string;
  providerName: string;
  referenceNumber: string | null;
  startDate: Date;
  endDate: Date;
  coverageSummary: string;
  termsDocumentId: string | null;
  status: AssetWarrantyStatus;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetServiceContract {
  id: string;
  organizationId: string;
  communityId: string;
  contractNumber: string;
  name: string;
  serviceProviderName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  startDate: Date;
  endDate: Date;
  contractType: ServiceContractType;
  status: ServiceContractStatus;
  coverageSummary: string;
  preventiveVisitsPerYear: number;
  includesParts: boolean;
  includesLabor: boolean;
  slaResponseHours: number | null;
  termsDocumentId: string | null;
  version: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetServiceContractLink {
  id: string;
  contractId: string;
  assetId: string;
  notes: string | null;
  createdAt: Date;
}

export interface AssetDowntime {
  id: string;
  assetId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  reason: AssetDowntimeReason;
  impactLevel: AssetDowntimeImpact;
  sourceWorkOrderId: string | null;
  notes: string | null;
  createdById: string | null;
  closedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetMeter {
  id: string;
  assetId: string;
  meterType: AssetMeterType;
  name: string;
  unit: string;
  currentReading: number | string;
  lastRecordedAt: Date | null;
  allowsReset: boolean;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetMeterReading {
  id: string;
  meterId: string;
  reading: number | string;
  previousReading: number | string | null;
  delta: number | string | null;
  source: AssetMeterReadingSource;
  sourceWorkOrderId: string | null;
  notes: string | null;
  documentId: string | null;
  recordedAt: Date;
  recordedById: string | null;
  createdAt: Date;
}

export interface AssetServiceRecord {
  id: string;
  assetId: string;
  serviceDate: Date;
  serviceType: AssetServiceRecordType;
  providerName: string | null;
  summary: string;
  technicianNotes: string | null;
  workOrderId: string | null;
  documentId: string | null;
  source: AssetServiceRecordSource;
  createdById: string | null;
  createdAt: Date;
}

export interface WorkOrderAssetLink {
  id: string;
  workOrderId: string;
  assetId: string;
  relationshipType: WorkOrderAssetRelationType;
  initialCondition: AssetCondition | null;
  resultingCondition: AssetCondition | null;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
}

export interface AssetImportJob {
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
  createdById: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface AssetKpiMetrics {
  totalAssets: number;
  activeAssets: number;
  criticalAssets: number;
  outOfServiceAssets: number;
  underMaintenanceAssets: number;
  warrantyExpiringSoonCount: number;
  contractExpiringSoonCount: number;
  maintenanceDueCount: number;
  overdueMaintenanceCount: number;
  openBreakdownsCount: number;
  availabilityPercentage: number;
  assetsByCategory: Array<{ categoryId: string; categoryName: string; count: number }>;
  assetsByCondition: Array<{ condition: AssetCondition; count: number }>;
  assetsByCriticality: Array<{ criticality: AssetCriticality; count: number }>;
}
