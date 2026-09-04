export type WorkerType =
  'EMPLOYEE' | 'CONTRACT_WORKER' | 'TEMPORARY' | 'CONSULTANT' | 'INTERN' | 'VOLUNTEER' | 'OTHER';

export type WorkerStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ON_LEAVE'
  | 'INACTIVE'
  | 'EXITED'
  | 'BLACKLISTED'
  | 'ARCHIVED';

export type EngagementType =
  'DIRECT_EMPLOYMENT' | 'VENDOR_CONTRACT' | 'TEMPORARY' | 'PROJECT_BASED' | 'CONSULTANT' | 'OTHER';

export type EngagementStatus = 'PLANNED' | 'ACTIVE' | 'SUSPENDED' | 'ENDED' | 'CANCELLED';

export type ProficiencyLevel = 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type ShiftStatus =
  | 'PLANNED'
  | 'OPEN'
  | 'PARTIALLY_STAFFED'
  | 'FULLY_STAFFED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type RosterStatus = 'DRAFT' | 'PUBLISHED' | 'REVISED' | 'CLOSED' | 'CANCELLED';

export type ShiftAssignmentStatus =
  | 'PLANNED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ABSENT'
  | 'REPLACED'
  | 'CANCELLED';

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'PARTIAL'
  | 'ON_LEAVE'
  | 'WEEK_OFF'
  | 'HOLIDAY'
  | 'UNSCHEDULED'
  | 'MISSING_CHECKOUT'
  | 'CORRECTED';

export type AttendanceEventType =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'BREAK_START'
  | 'BREAK_END'
  | 'MANUAL_CORRECTION'
  | 'SUPERVISOR_CONFIRMATION'
  | 'AUTO_FLAG';

export type AttendanceMethod =
  | 'MOBILE'
  | 'QR'
  | 'RFID'
  | 'NFC'
  | 'SECURITY_GATE_REFERENCE'
  | 'BIOMETRIC_DEVICE_REFERENCE'
  | 'MANUAL'
  | 'WEB_ADMIN'
  | 'OTHER';

export type GeofenceDecision =
  'VALID' | 'OUTSIDE_GEOFENCE' | 'LOW_ACCURACY' | 'LOCATION_UNAVAILABLE' | 'MANUAL_REVIEW_REQUIRED';

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID' | 'COMP_OFF' | 'OTHER';

export type LeaveStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type OvertimeStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECORDED' | 'CANCELLED';

export type DeploymentStatus = 'PLANNED' | 'ACTIVE' | 'SUSPENDED' | 'ENDED' | 'CANCELLED';

export type WorkforceTaskStatus =
  'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

export type CoverageStatus = 'FULL' | 'UNDERSTAFFED' | 'OVERSTAFFED' | 'UNSTAFFED';
