export type SecurityGateType =
  | 'MAIN'
  | 'SECONDARY'
  | 'SERVICE'
  | 'PEDESTRIAN'
  | 'VEHICLE'
  | 'EMERGENCY'
  | 'DELIVERY'
  | 'STAFF'
  | 'OTHER';

export type SecurityGateStatus =
  'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'TEMPORARILY_CLOSED' | 'ARCHIVED';

export type GateDirectionPolicy = 'ENTRY_AND_EXIT' | 'ENTRY_ONLY' | 'EXIT_ONLY';

export type VisitType =
  | 'GUEST'
  | 'DELIVERY'
  | 'CAB'
  | 'SERVICE_PERSON'
  | 'DOMESTIC_HELP'
  | 'CONTRACTOR'
  | 'VENDOR_STAFF'
  | 'PROJECT_WORKER'
  | 'STAFF'
  | 'MOVE_IN_OUT_SUPPORT'
  | 'EVENT_GUEST'
  | 'OTHER';

export type VisitStatus =
  | 'EXPECTED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'DENIED'
  | 'PASS_ISSUED'
  | 'ARRIVED'
  | 'CHECKED_IN'
  | 'ACTIVE'
  | 'CHECKED_OUT'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REVOKED'
  | 'BLOCKED';

export type InvitationStatus =
  'DRAFT' | 'ACTIVE' | 'USED' | 'PARTIALLY_USED' | 'EXPIRED' | 'CANCELLED' | 'REVOKED';

export type AccessPassType =
  | 'SINGLE_ENTRY'
  | 'MULTI_ENTRY'
  | 'DATE_RANGE'
  | 'RECURRING'
  | 'EVENT'
  | 'CONTRACTOR'
  | 'SERVICE'
  | 'DELIVERY'
  | 'TEMPORARY';

export type PassCredentialType =
  'QR' | 'OTP' | 'PIN' | 'TOKEN' | 'RFID_REFERENCE' | 'EXTERNAL_ACCESS_CREDENTIAL';

export type AccessDecisionType =
  | 'ALLOW'
  | 'DENY'
  | 'REQUIRE_HOST_APPROVAL'
  | 'REQUIRE_SUPERVISOR_OVERRIDE'
  | 'REQUIRE_ADDITIONAL_VERIFICATION'
  | 'BLOCKED';

export type GateAccessEventType =
  | 'ARRIVAL'
  | 'APPROVAL_REQUESTED'
  | 'APPROVED'
  | 'DENIED'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'PASS_VALIDATED'
  | 'PASS_REJECTED'
  | 'OVERRIDE'
  | 'REVOKED_ATTEMPT'
  | 'BLOCKED_ATTEMPT'
  | 'MANUAL_CORRECTION'
  | 'EMERGENCY_EXIT'
  | 'OTHER';

export type DeliveryType =
  'FOOD' | 'ECOMMERCE' | 'COURIER' | 'GROCERY' | 'MEDICINE' | 'LARGE_ITEM' | 'OTHER';

export type WatchlistSubjectType =
  'VISITOR' | 'PHONE' | 'VEHICLE' | 'CONTRACTOR_WORKER' | 'VENDOR' | 'PASS' | 'OTHER';

export type WatchlistStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ARCHIVED';

export type WatchlistSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GateDeviceType =
  | 'QR_SCANNER'
  | 'RFID_READER'
  | 'ANPR_CAMERA'
  | 'BARRIER_CONTROLLER'
  | 'TURNSTILE'
  | 'TABLET'
  | 'PRINTER'
  | 'OTHER';

export type GateDeviceStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN';

export interface SecurityDashboardKpis {
  activeVisitorsCount: number;
  expectedTodayCount: number;
  totalEntriesToday: number;
  totalExitsToday: number;
  pendingApprovalsCount: number;
  deliveriesTodayCount: number;
  contractorsInsideCount: number;
  overstayAlertsCount: number;
  watchlistAlertsCount: number;
  onlineDevicesCount: number;
}
