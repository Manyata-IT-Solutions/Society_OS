import {
  AmenityCategoryType,
  AmenityBookingMode,
  AmenityResourceType,
  SlotModelType,
  AmenityBookingType,
  AmenityPricingType,
} from '@community-os/types';

export interface CreateAmenityDto {
  organizationId: string;
  communityId: string;
  code: string;
  name: string;
  description?: string;
  category: AmenityCategoryType;
  bookingMode?: AmenityBookingMode;
  capacity?: number;
  requiresBooking?: boolean;
  requiresApproval?: boolean;
  guestAllowed?: boolean;
  isPaid?: boolean;
  locationReference?: string;
  coverDocumentId?: string;
  termsDocumentId?: string;
}

export interface CreateAmenityResourceDto {
  amenityId: string;
  code: string;
  name: string;
  description?: string;
  resourceType?: AmenityResourceType;
  capacity?: number;
  isExclusive?: boolean;
  linkedAssetId?: string;
}

export interface SetOperatingScheduleDto {
  amenityId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  validFrom?: string;
  validUntil?: string;
}

export interface SetBookingPolicyDto {
  amenityId: string;
  name: string;
  slotModel?: SlotModelType;
  slotDurationMinutes?: number;
  minimumDurationMinutes?: number;
  maximumDurationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  advanceBookingDays?: number;
  minimumNoticeMinutes?: number;
  maxActiveBookingsPerUnit?: number;
  maxBookingsPerWeekPerUnit?: number;
  maxGuests?: number;
  requiresCheckIn?: boolean;
  checkInGraceMinutes?: number;
  requiresTermsAcceptance?: boolean;
}

export interface SetPricingPolicyDto {
  amenityId: string;
  name: string;
  pricingType: AmenityPricingType;
  baseRate: number;
  hourlyRate?: number;
  guestRate?: number;
  depositAmount?: number;
}

export interface CheckAvailabilityDto {
  amenityId: string;
  resourceId?: string;
  date: string;
  durationMinutes?: number;
  participantCount?: number;
}

export interface CreateBookingDto {
  organizationId: string;
  communityId: string;
  amenityId: string;
  resourceId?: string;
  unitId?: string;
  householdId?: string;
  residentId?: string;
  bookingType?: AmenityBookingType;
  startAt: string;
  endAt: string;
  participantCount?: number;
  guestCount?: number;
  parkingRequested?: boolean;
  termsAccepted?: boolean;
}

export interface DecideBookingApprovalDto {
  bookingId: string;
  approved: boolean;
  reviewNotes?: string;
}

export interface JoinWaitlistDto {
  amenityId: string;
  resourceId?: string;
  residentId?: string;
  householdId?: string;
  unitId?: string;
  desiredStartAt: string;
  desiredEndAt: string;
  partySize?: number;
}

export interface CreateMaintenanceBlockDto {
  amenityId: string;
  resourceId?: string;
  reason: string;
  startAt: string;
  endAt: string;
  workOrderId?: string;
  projectId?: string;
}

export interface CheckInBookingDto {
  bookingId: string;
  operatorUserId?: string;
}

export interface ReportDamageDto {
  bookingId: string;
  amenityId: string;
  resourceId?: string;
  description: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedAmount?: number;
}

export interface SettleDepositDto {
  damageReportId?: string;
  bookingId: string;
  approvedDeductionAmount: number;
  notes?: string;
}

export interface SubmitFeedbackDto {
  bookingId: string;
  amenityId: string;
  residentId?: string;
  rating: number;
  comments?: string;
}
