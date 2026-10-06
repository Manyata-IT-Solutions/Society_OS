import type {
  SecurityGateType,
  GateDirectionPolicy,
  VisitType,
  AccessPassType,
  WatchlistSubjectType,
  WatchlistSeverity,
} from '@community-os/types';

export interface CreateSecurityGateDto {
  organizationId: string;
  communityId: string;
  code: string;
  name: string;
  gateType?: SecurityGateType;
  directionPolicy?: GateDirectionPolicy;
  locationDescription?: string;
  supportsVehicleEntry?: boolean;
  supportsPedestrianEntry?: boolean;
  supportsDelivery?: boolean;
  supportsContractorEntry?: boolean;
}

export interface InviteVisitorDto {
  organizationId: string;
  communityId: string;
  destinationUnitId: string;
  visitorName: string;
  phone?: string;
  visitType?: VisitType;
  purpose?: string;
  expectedFrom: string | Date;
  expectedUntil: string | Date;
  passType?: AccessPassType;
  vehicleExpected?: boolean;
  vehicleNumber?: string;
}

export interface CreateWalkInVisitDto {
  organizationId: string;
  communityId: string;
  destinationUnitId: string;
  visitorName: string;
  phone?: string;
  visitType?: VisitType;
  purpose?: string;
  vehicleNumber?: string;
  gateId: string;
}

export interface ValidatePassDto {
  gateId: string;
  rawToken?: string;
  otp?: string;
}

export interface CheckInVisitDto {
  visitId: string;
  gateId: string;
  vehicleNumber?: string;
}

export interface CheckOutVisitDto {
  visitId: string;
  gateId: string;
}

export interface ManualCheckoutDto {
  visitId: string;
  gateId: string;
  reason: string;
}

export interface DecideVisitApprovalDto {
  approvalId: string;
  approved: boolean;
  decisionReason?: string;
}

export interface CreateHouseholdServiceAccessDto {
  communityId: string;
  householdId: string;
  unitId: string;
  servicePersonName: string;
  phone: string;
  serviceType: string;
  validFrom: string | Date;
  validUntil: string | Date;
  allowedDays?: string;
  allowedTimeStart?: string;
  allowedTimeEnd?: string;
}

export interface CreateContractorAuthorizationDto {
  organizationId: string;
  communityId: string;
  vendorId: string;
  projectId?: string;
  workOrderId?: string;
  title: string;
  authorizedFrom: string | Date;
  authorizedUntil: string | Date;
  allowedGates?: string;
  workerLimit?: number;
  timeWindows?: string;
  workers?: Array<{
    name: string;
    phone?: string;
    workerReference: string;
    skillTrade?: string;
  }>;
}

export interface CreateWatchlistEntryDto {
  organizationId: string;
  communityId: string;
  subjectType: WatchlistSubjectType;
  subjectIdentifier: string;
  severity?: WatchlistSeverity;
  action?: string;
  reason: string;
  validFrom?: string | Date;
  validUntil?: string | Date;
}

export interface SecurityOverrideDto {
  gateId: string;
  visitId?: string;
  visitorName: string;
  reason: string;
  actionTaken: string;
}

export interface ShiftHandoverDto {
  shiftId: string;
  handoverToId: string;
  notes?: string;
}
