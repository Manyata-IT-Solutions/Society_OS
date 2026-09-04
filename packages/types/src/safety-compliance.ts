export type SOSType =
  'MEDICAL' | 'FIRE' | 'SECURITY' | 'PERSONAL_SAFETY' | 'LIFT_ENTRAPMENT' | 'ACCIDENT' | 'OTHER';

export type SOSStatus =
  | 'RAISED'
  | 'RECEIVED'
  | 'ACKNOWLEDGED'
  | 'INCIDENT_CREATED'
  | 'RESOLVED_WITHOUT_INCIDENT'
  | 'FALSE_ALARM'
  | 'CANCELLED';

export type IncidentType =
  | 'FIRE'
  | 'MEDICAL'
  | 'SECURITY'
  | 'UTILITY'
  | 'ELECTRICAL'
  | 'GAS_LEAK'
  | 'FLOODING'
  | 'WATER_CONTAMINATION'
  | 'LIFT_ENTRAPMENT'
  | 'STRUCTURAL'
  | 'ENVIRONMENTAL'
  | 'NATURAL_DISASTER'
  | 'VEHICLE'
  | 'WORKPLACE_INJURY'
  | 'PUBLIC_SAFETY'
  | 'MISSING_PERSON'
  | 'OTHER';

export type IncidentSeverity =
  'SEV_1_CRITICAL' | 'SEV_2_HIGH' | 'SEV_3_MEDIUM' | 'SEV_4_LOW' | 'SEV_5_INFORMATIONAL';

export type IncidentPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'REPORTED'
  | 'TRIAGED'
  | 'ACKNOWLEDGED'
  | 'ACTIVE'
  | 'CONTAINED'
  | 'RECOVERY'
  | 'UNDER_INVESTIGATION'
  | 'CORRECTIVE_ACTION'
  | 'RESOLVED'
  | 'UNDER_REVIEW'
  | 'CLOSED'
  | 'CANCELLED'
  | 'FALSE_ALARM';

export type IncidentSourceType =
  | 'SOS'
  | 'SECURITY'
  | 'RESIDENT'
  | 'WORKER'
  | 'VISITOR'
  | 'UTILITY_ALERT'
  | 'ASSET_ALERT'
  | 'WORK_ORDER'
  | 'MANUAL'
  | 'EXTERNAL_SERVICE'
  | 'DEVICE'
  | 'OTHER';

export type CommandLevel = 'LOCAL' | 'BUILDING' | 'COMMUNITY' | 'ORGANIZATION' | 'PORTFOLIO';

export type ResponderStatus =
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'ACTIVE'
  | 'STANDBY'
  | 'RELEASED'
  | 'UNAVAILABLE';

export type ActionStatus =
  'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED' | 'NOT_REQUIRED';

export type EvacuationStatus =
  | 'ORDERED'
  | 'IN_PROGRESS'
  | 'MUSTERING'
  | 'ACCOUNTABILITY_IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SUPERSEDED';

export type MusterStatus =
  | 'NOT_CHECKED'
  | 'SAFE_AT_MUSTER'
  | 'SAFE_ELSEWHERE'
  | 'EXITED'
  | 'NOT_ON_SITE'
  | 'UNACCOUNTED'
  | 'UNKNOWN'
  | 'DUPLICATE_REVIEW';

export type HazardStatus =
  | 'REPORTED'
  | 'VALIDATED'
  | 'CONTROL_PENDING'
  | 'CONTROLLED'
  | 'MONITORING'
  | 'CLOSED'
  | 'REJECTED';

export type RiskCategory =
  | 'FIRE'
  | 'SECURITY'
  | 'ELECTRICAL'
  | 'STRUCTURAL'
  | 'WATER'
  | 'ENVIRONMENTAL'
  | 'MEDICAL'
  | 'OPERATIONAL'
  | 'FINANCIAL_REFERENCE'
  | 'COMPLIANCE'
  | 'PROJECT'
  | 'OTHER';

export type RiskLikelihood = 'RARE' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'ALMOST_CERTAIN';

export type RiskImpact = 'INSIGNIFICANT' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'CATASTROPHIC';

export type RiskStatus =
  | 'IDENTIFIED'
  | 'ASSESSED'
  | 'TREATMENT_PLANNED'
  | 'MONITORING'
  | 'ACCEPTED'
  | 'CLOSED'
  | 'ARCHIVED';

export type InspectionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type FindingSeverity = 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR' | 'OBSERVATION';

export type FindingStatus =
  | 'OPEN'
  | 'ACCEPTED'
  | 'ACTION_REQUIRED'
  | 'IN_REMEDIATION'
  | 'PENDING_VERIFICATION'
  | 'CLOSED'
  | 'NOT_APPLICABLE';

export type CAPAStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'OVERDUE';

export type DrillType =
  'FIRE' | 'EVACUATION' | 'MEDICAL' | 'EARTHQUAKE' | 'FLOOD' | 'SECURITY' | 'UTILITY' | 'OTHER';

export type DrillStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EVALUATED'
  | 'CLOSED'
  | 'CANCELLED';

export type ComplianceCategory =
  | 'FIRE_SAFETY'
  | 'LIFT'
  | 'ELECTRICAL'
  | 'BUILDING'
  | 'ENVIRONMENTAL'
  | 'WATER'
  | 'STP'
  | 'LABOUR_REFERENCE'
  | 'SECURITY'
  | 'INSURANCE'
  | 'TAX_REFERENCE'
  | 'CORPORATE_GOVERNANCE_REFERENCE'
  | 'OTHER';

export type ComplianceStatus =
  | 'NOT_ASSESSED'
  | 'COMPLIANT_EVIDENCE_CURRENT'
  | 'ACTION_REQUIRED'
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'EXPIRED'
  | 'NON_COMPLIANT'
  | 'UNDER_REVIEW'
  | 'NOT_APPLICABLE';

export type CredentialType =
  | 'LICENSE'
  | 'CERTIFICATE'
  | 'PERMIT'
  | 'NOC'
  | 'REGISTRATION'
  | 'INSPECTION_CERTIFICATE'
  | 'TEST_CERTIFICATE'
  | 'INSURANCE_CERTIFICATE'
  | 'OTHER';

export type CredentialStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'SUPERSEDED'
  | 'UNDER_RENEWAL';

export type PermitStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CLOSED'
  | 'EXPIRED'
  | 'CANCELLED';
