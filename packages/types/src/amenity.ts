export type AmenityCategoryType =
  | 'SPORTS'
  | 'FITNESS'
  | 'EVENT'
  | 'RECREATION'
  | 'GUEST_ACCOMMODATION'
  | 'COMMUNITY'
  | 'WORKSPACE'
  | 'WELLNESS'
  | 'OTHER';

export type AmenityStatus =
  'DRAFT' | 'ACTIVE' | 'TEMPORARILY_CLOSED' | 'MAINTENANCE' | 'INACTIVE' | 'ARCHIVED';

export type AmenityBookingMode = 'INSTANT' | 'APPROVAL_REQUIRED';

export type AmenityResourceType = 'EXCLUSIVE' | 'CAPACITY_BASED';

export type AmenityResourceStatus =
  'ACTIVE' | 'BLOCKED' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'INACTIVE' | 'ARCHIVED';

export type SlotModelType = 'FIXED_SLOT' | 'FLEXIBLE_DURATION' | 'DATE_RANGE';

export type AmenityBookingType =
  | 'STANDARD'
  | 'EVENT'
  | 'GUEST_ROOM'
  | 'SPORT'
  | 'CLASS'
  | 'PRIVATE_EVENT'
  | 'COMMUNITY_EVENT'
  | 'MANAGEMENT_BLOCK'
  | 'OTHER';

export type AmenityBookingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'CHECKED_IN'
  | 'IN_USE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'NO_SHOW'
  | 'EXPIRED';

export type AmenityPricingType =
  'FREE' | 'FLAT' | 'PER_HOUR' | 'PER_SLOT' | 'PER_PERSON' | 'PER_GUEST' | 'PER_NIGHT';

export type AmenityDepositStatus =
  | 'NOT_REQUIRED'
  | 'REQUIRED'
  | 'PENDING'
  | 'COLLECTED'
  | 'PARTIALLY_APPLIED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'FORFEITED'
  | 'CANCELLED';

export type AmenityCancellationOutcome =
  'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND' | 'CANCELLATION_FEE' | 'CREDIT_ADJUSTMENT';

export type AmenityWaitlistStatus =
  'WAITING' | 'OFFERED' | 'ACCEPTED' | 'EXPIRED' | 'DECLINED' | 'CANCELLED' | 'FULFILLED';

export interface AmenityDashboardKpis {
  totalAmenities: number;
  totalResources: number;
  bookingsToday: number;
  upcomingBookings: number;
  pendingApprovals: number;
  activeCheckIns: number;
  waitlistCount: number;
  openMaintenanceBlocks: number;
  averageUtilizationPercent: number;
}
