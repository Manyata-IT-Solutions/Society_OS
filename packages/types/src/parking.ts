export type ParkingVehicleType =
  'CAR' | 'SUV' | 'MOTORCYCLE' | 'SCOOTER' | 'BICYCLE' | 'COMMERCIAL' | 'VAN' | 'OTHER';

export type VehicleFuelType =
  'PETROL' | 'DIESEL' | 'CNG' | 'LPG' | 'HYBRID' | 'ELECTRIC' | 'OTHER' | 'UNKNOWN';

export type VehicleStatus =
  'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'TRANSFERRED' | 'REMOVED' | 'ARCHIVED';

export type VehicleAuthorizationType =
  'OWNER' | 'FAMILY' | 'LEASED' | 'COMPANY' | 'AUTHORIZED_USER' | 'TEMPORARY' | 'OTHER';

export type VehicleVerificationStatus =
  'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export type ParkingAreaType =
  'COVERED' | 'OPEN' | 'BASEMENT' | 'PODIUM' | 'STILT' | 'VISITOR' | 'SERVICE' | 'MIXED' | 'OTHER';

export type ParkingSlotType =
  | 'CAR'
  | 'TWO_WHEELER'
  | 'BICYCLE'
  | 'EV_CAR'
  | 'EV_TWO_WHEELER'
  | 'ACCESSIBLE'
  | 'VISITOR'
  | 'SERVICE'
  | 'LOADING'
  | 'OTHER';

export type ParkingSlotStatus =
  'AVAILABLE' | 'BLOCKED' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'ARCHIVED';

export type ParkingOwnershipModel =
  | 'COMMON'
  | 'UNIT_LINKED'
  | 'SOCIETY_ASSIGNED'
  | 'LEASED'
  | 'PRIVATE_TITLE_REFERENCE'
  | 'VISITOR_POOL'
  | 'SERVICE_POOL';

export type ParkingRightType =
  | 'OWNED_REFERENCE'
  | 'ASSIGNED'
  | 'LEASED'
  | 'RENTED'
  | 'SHARED'
  | 'ROTATIONAL'
  | 'TEMPORARY'
  | 'VISITOR'
  | 'STAFF'
  | 'CONTRACTOR'
  | 'OTHER';

export type ParkingAllocationType =
  | 'PERMANENT'
  | 'TEMPORARY'
  | 'ROTATIONAL'
  | 'SHARED'
  | 'VISITOR'
  | 'CONTRACTOR'
  | 'SERVICE'
  | 'OTHER';

export type ParkingAllocationStatus =
  'SCHEDULED' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';

export type ParkingPermitType =
  'RESIDENT' | 'TEMPORARY' | 'VISITOR' | 'CONTRACTOR' | 'STAFF' | 'SERVICE';

export type ParkingPermitStatus =
  'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED' | 'CANCELLED';

export type ParkingOccupancyStatus = 'ACTIVE' | 'COMPLETED' | 'MANUALLY_CORRECTED' | 'CANCELLED';

export type ParkingViolationType =
  | 'UNAUTHORIZED_PARKING'
  | 'WRONG_SLOT'
  | 'BLOCKING_ACCESS'
  | 'ACCESSIBLE_SLOT_MISUSE'
  | 'VISITOR_OVERTIME'
  | 'NO_VALID_PERMIT'
  | 'FIRE_LANE'
  | 'DOUBLE_PARKING'
  | 'EV_SLOT_MISUSE'
  | 'ABANDONED_VEHICLE'
  | 'OTHER';

export type ParkingViolationStatus =
  'OPEN' | 'UNDER_REVIEW' | 'CONFIRMED' | 'DISPUTED' | 'RESOLVED' | 'CANCELLED' | 'WAIVED';

export type ParkingViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EVChargingSessionStatus = 'REQUESTED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ParkingCapacitySummaryDto {
  totalSlots: number;
  allocatedSlots: number;
  occupiedSlots: number;
  visitorCapacity: number;
  visitorOccupied: number;
  evSlots: number;
  accessibleSlots: number;
  availableSlots: number;
}
