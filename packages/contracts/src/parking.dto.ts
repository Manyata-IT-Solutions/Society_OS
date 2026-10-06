import type {
  ParkingVehicleType,
  VehicleFuelType,
  VehicleAuthorizationType,
  ParkingAreaType,
  ParkingSlotType,
  ParkingOwnershipModel,
  ParkingRightType,
  ParkingAllocationType,
  ParkingPermitType,
  ParkingViolationType,
  ParkingViolationSeverity,
} from '@community-os/types';

export interface RegisterVehicleDto {
  organizationId: string;
  communityId: string;
  registrationNumber: string;
  vehicleType?: ParkingVehicleType;
  make?: string;
  model?: string;
  variant?: string;
  color?: string;
  fuelType?: VehicleFuelType;
  isEv?: boolean;
  householdId?: string;
  unitId?: string;
  residentId?: string;
  authorizationType?: VehicleAuthorizationType;
}

export interface VerifyVehicleDto {
  vehicleAuthorizationId: string;
  verified: boolean;
  rejectionReason?: string;
}

export interface CreateParkingAreaDto {
  organizationId: string;
  communityId: string;
  code: string;
  name: string;
  type?: ParkingAreaType;
  buildingId?: string;
  floorId?: string;
  totalCapacity?: number;
}

export interface CreateParkingSlotDto {
  organizationId: string;
  communityId: string;
  parkingAreaId: string;
  zoneId?: string;
  slotNumber: string;
  slotType?: ParkingSlotType;
  isAccessible?: boolean;
  isEvEnabled?: boolean;
  chargerAssetId?: string;
  ownershipModel?: ParkingOwnershipModel;
}

export interface BulkCreateSlotsDto {
  organizationId: string;
  communityId: string;
  parkingAreaId: string;
  prefix: string;
  startNumber: number;
  count: number;
  slotType?: ParkingSlotType;
  isEvEnabled?: boolean;
  isAccessible?: boolean;
}

export interface GrantParkingRightDto {
  organizationId: string;
  communityId: string;
  unitId?: string;
  householdId?: string;
  residentId?: string;
  rightType?: ParkingRightType;
  slotTypeEligibility?: ParkingSlotType;
  quantity?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface CreateParkingAllocationDto {
  organizationId: string;
  communityId: string;
  parkingRightId: string;
  parkingSlotId: string;
  vehicleId?: string;
  unitId?: string;
  householdId?: string;
  allocationType?: ParkingAllocationType;
  validFrom?: string;
  validUntil?: string;
}

export interface IssueParkingPermitDto {
  organizationId: string;
  communityId: string;
  vehicleId: string;
  parkingRightId?: string;
  allocationId?: string;
  permitType?: ParkingPermitType;
  validFrom?: string;
  validUntil?: string;
  rfidCredentialTag?: string;
}

export interface EvaluateVisitorParkingDto {
  communityId: string;
  visitId: string;
  vehicleNumber: string;
  gateId?: string;
}

export interface RecordOccupancyDto {
  communityId: string;
  vehicleId: string;
  parkingAreaId: string;
  parkingSlotId?: string;
  sourceType?: string;
  entryGateId?: string;
}

export interface CreateParkingViolationDto {
  organizationId: string;
  communityId: string;
  vehicleNumber: string;
  vehicleId?: string;
  parkingSlotId?: string;
  parkingAreaId?: string;
  violationType: ParkingViolationType;
  severity?: ParkingViolationSeverity;
  description: string;
  evidenceDocumentId?: string;
  penaltyChargeAmount?: number;
}

export interface DecideViolationAppealDto {
  appealId: string;
  approved: boolean;
  reviewNotes?: string;
}

export interface RecordEVChargingSessionDto {
  organizationId: string;
  communityId: string;
  parkingSlotId: string;
  vehicleId: string;
  chargerAssetId?: string;
  residentId?: string;
  householdId?: string;
  meterStartKwh: number;
  meterEndKwh: number;
  energyConsumedKwh: number;
  billedAmount?: number;
}
