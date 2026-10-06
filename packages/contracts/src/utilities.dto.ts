import {
  UtilityType,
  UtilitySourceType,
  UtilityMeterType,
  MeasurementType,
  MeterAssignmentTargetType,
  MeterReadingType,
  MeterReadingSource,
  TariffComponentType,
  UtilityOutageType,
  WaterTankerStatus,
} from '@community-os/types';

// Utility Service
export interface CreateUtilityServiceDto {
  organizationId: string;
  communityId: string;
  code: string;
  name: string;
  utilityType: UtilityType | string;
  unitOfMeasure: string;
  billingEnabled?: boolean;
  timezone?: string;
}

export interface CreateUtilitySupplySourceDto {
  utilityServiceId: string;
  sourceType: UtilitySourceType | string;
  code: string;
  name: string;
  assetId?: string;
  vendorId?: string;
  capacity?: number;
  capacityUom?: string;
}

// Utility Meter
export interface CreateUtilityMeterDto {
  organizationId: string;
  communityId: string;
  utilityServiceId: string;
  meterNumber: string;
  serialNumber?: string;
  meterType?: UtilityMeterType | string;
  measurementType?: MeasurementType | string;
  uom: string;
  multiplier?: number;
  decimalPlaces?: number;
  rolloverValue?: number;
  parentMeterId?: string;
  assetId?: string;
}

export interface AssignUtilityMeterDto {
  meterId: string;
  targetType: MeterAssignmentTargetType | string;
  targetId: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  allocationPercentage?: number;
}

export interface ReplaceUtilityMeterDto {
  oldMeterId: string;
  oldMeterFinalReading: number;
  newMeterId: string;
  newMeterOpeningReading: number;
  effectiveAt: string;
  reason?: string;
}

// Meter Reading
export interface RecordMeterReadingDto {
  meterId: string;
  readingAt: string;
  value: number;
  uom: string;
  readingType?: MeterReadingType | string;
  source?: MeterReadingSource | string;
  evidenceDocumentId?: string;
  notes?: string;
}

export interface CorrectMeterReadingDto {
  readingId: string;
  correctedValue: number;
  reason: string;
}

export interface EstimateMeterReadingDto {
  meterId: string;
  readingAt: string;
  estimatedValue: number;
  estimationMethod: string;
}

// Tariff Plan
export interface TariffSlabDto {
  fromUnit: number;
  toUnit?: number;
  ratePerUnit: number;
}

export interface CreateTariffComponentDto {
  componentType: TariffComponentType | string;
  name: string;
  fixedAmount?: number;
  ratePerUnit?: number;
  minimumAmount?: number;
  slabs?: TariffSlabDto[];
}

export interface CreateUtilityTariffPlanDto {
  utilityServiceId: string;
  name: string;
  code: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  currency: string;
  billingUom: string;
  components: CreateTariffComponentDto[];
}

// Charge Calculation & Billing Handoff
export interface CalculateUtilityChargeDto {
  meterId: string;
  tariffPlanId: string;
  periodStart: string;
  periodEnd: string;
}

export interface HandoffUtilityChargeDto {
  chargeCalculationId: string;
  billableAccountId: string;
  billingPeriod: string;
}

export interface CommonAreaAllocationDto {
  communityId: string;
  meterId: string;
  periodStart: string;
  periodEnd: string;
  allocationPolicy: string; // 'EQUAL_PER_UNIT' | 'AREA_BASED'
}

// Outage
export interface ReportUtilityOutageDto {
  organizationId: string;
  communityId: string;
  utilityServiceId: string;
  outageType: UtilityOutageType | string;
  title: string;
  description?: string;
  startAt: string;
  affectedScope?: string;
  noticeId?: string;
}

export interface RestoreUtilityOutageDto {
  outageId: string;
  restoredAt: string;
  resolutionNotes?: string;
}

// Tanker Delivery
export interface RecordWaterTankerDeliveryDto {
  organizationId: string;
  communityId: string;
  vendorId: string;
  vehicleNumber: string;
  deliveryAt: string;
  declaredQuantity: number;
  verifiedQuantity?: number;
  uom: string;
  receivingLocation?: string;
  receivedByWorkerId?: string;
  status?: WaterTankerStatus | string;
}

// DG Run
export interface RecordDGRunSessionDto {
  communityId: string;
  assetId: string;
  startAt: string;
  endAt: string;
  openingEnergyReading: number;
  closingEnergyReading: number;
  fuelConsumedLitres: number;
  operatorWorkerId?: string;
}

// Solar
export interface RecordSolarGenerationDto {
  communityId: string;
  assetId: string;
  generationDate: string;
  generationKwh: number;
  selfConsumedKwh: number;
  exportedKwh: number;
}
