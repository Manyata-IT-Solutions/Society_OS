export type ProjectType =
  | 'CAPEX'
  | 'MAJOR_REPAIR'
  | 'RENOVATION'
  | 'INFRASTRUCTURE'
  | 'SAFETY'
  | 'ENERGY'
  | 'UTILITY'
  | 'TECHNOLOGY'
  | 'COMPLIANCE'
  | 'OTHER';

export type ProjectClassification = 'CAPEX' | 'OPEX' | 'MIXED';

export type ProjectStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PLANNING'
  | 'PROCUREMENT'
  | 'READY_TO_START'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'DELAYED'
  | 'SUBSTANTIALLY_COMPLETE'
  | 'UNDER_HANDOVER'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProjectTeamRole =
  | 'PROJECT_MANAGER'
  | 'SITE_ENGINEER'
  | 'SUPERVISOR'
  | 'COMMITTEE_REP'
  | 'FINANCE_REVIEWER'
  | 'PROCUREMENT_COORDINATOR'
  | 'SAFETY_OFFICER'
  | 'EXTERNAL_CONSULTANT'
  | 'OTHER';

export type BoqStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'SUPERSEDED' | 'CANCELLED';

export type WorkPackageStatus =
  'DRAFT' | 'TENDERING' | 'AWARDED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type MilestoneStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'AT_RISK' | 'DELAYED' | 'COMPLETED' | 'CANCELLED';

export type MeasurementStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'CANCELLED';

export type CertificateStatus =
  'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type VariationType =
  | 'SCOPE_CHANGE'
  | 'QUANTITY_CHANGE'
  | 'RATE_CHANGE'
  | 'DESIGN_CHANGE'
  | 'SITE_CONDITION'
  | 'REGULATORY'
  | 'EMERGENCY'
  | 'OMISSION'
  | 'OTHER';

export type VariationStatus =
  'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED' | 'CANCELLED';

export type DelayCause =
  | 'VENDOR'
  | 'WEATHER'
  | 'ACCESS'
  | 'DESIGN'
  | 'MATERIAL'
  | 'APPROVAL'
  | 'PAYMENT'
  | 'SITE_CONDITION'
  | 'RESIDENT_RESTRICTION'
  | 'REGULATORY'
  | 'OTHER';

export type InspectionType = 'MATERIAL' | 'WORKMANSHIP' | 'MILESTONE' | 'PRE_HANDOVER' | 'SAFETY';

export type InspectionResult = 'PASS' | 'PASS_WITH_OBSERVATIONS' | 'FAIL' | 'REWORK_REQUIRED';

export type SnagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SnagStatus =
  'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'CLOSED' | 'REOPENED' | 'CANCELLED';

export type HandoverStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export type AssetHandoverAction = 'CREATE_NEW' | 'UPGRADE_EXISTING';

export interface ProjectSummaryKpis {
  totalProjectsCount: number;
  activeProjectsCount: number;
  completedProjectsCount: number;
  delayedProjectsCount: number;
  totalApprovedBudget: number;
  totalCommitted: number;
  totalActualSpend: number;
  totalPaid: number;
  totalRetentionWithheld: number;
  totalAdvanceRecoverable: number;
  totalForecastFinalCost: number;
  totalAvailableBudget: number;
  averagePhysicalProgress: number;
  openCriticalSnagsCount: number;
  openVariationsCount: number;
}
