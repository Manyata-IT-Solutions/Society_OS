import type {
  ProjectType,
  ProjectClassification,
  ProjectPriority,
  ProjectTeamRole,
  VariationType,
  SnagSeverity,
  AssetHandoverAction,
} from '@community-os/types';

export interface CreateProjectDto {
  organizationId: string;
  communityId: string;
  name: string;
  description?: string;
  projectType?: ProjectType;
  classification?: ProjectClassification;
  priority?: ProjectPriority;
  capexInitiativeId?: string;
  budgetId?: string;
  budgetLineId?: string;
  fundId?: string;
  costCenterId?: string;
  plannedStartDate: string | Date;
  plannedEndDate: string | Date;
  approvedBudget: number;
  currency?: string;
  projectManagerId?: string;
  teamMembers?: Array<{
    userId?: string;
    name: string;
    email?: string;
    phone?: string;
    role: ProjectTeamRole;
    isExternal?: boolean;
    companyName?: string;
  }>;
  locations?: Array<{
    communitySectionId?: string;
    buildingId?: string;
    floorId?: string;
    unitId?: string;
    commonAreaName?: string;
    description?: string;
  }>;
}

export interface UpdateProjectScopeDto {
  scopeSummary: string;
  objectives?: string;
  inScope?: string;
  outOfScope?: string;
  acceptanceCriteria?: string;
  technicalRequirements?: string;
  constraints?: string;
  assumptions?: string;
}

export interface CreateBoqDto {
  projectId: string;
  name: string;
  currency?: string;
  effectiveDate?: string | Date;
  lines: Array<{
    lineNumber?: number;
    sectionCode: string;
    itemCode?: string;
    description: string;
    specification?: string;
    quantity: number;
    uomName: string;
    estimatedRate: number;
    costCategory?: string;
    fundId?: string;
    costCenterId?: string;
    assetCategoryId?: string;
    notes?: string;
  }>;
}

export interface ReviseBoqDto {
  boqId: string;
  revisionReason: string;
  lines: Array<{
    lineNumber?: number;
    sectionCode: string;
    itemCode?: string;
    description: string;
    specification?: string;
    quantity: number;
    uomName: string;
    estimatedRate: number;
    costCategory?: string;
    fundId?: string;
    costCenterId?: string;
    notes?: string;
  }>;
}

export interface CreateWorkPackageDto {
  projectId: string;
  name: string;
  scope?: string;
  plannedStart?: string | Date;
  plannedEnd?: string | Date;
  estimatedAmount: number;
  budgetLineId?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  contractValue?: number;
  retentionPercent?: number;
  mobilizationAdvanceAmount?: number;
}

export interface CreateMilestoneDto {
  projectId: string;
  workPackageId?: string;
  code: string;
  name: string;
  description?: string;
  plannedDate: string | Date;
  forecastDate?: string | Date;
  weightPercent?: number;
  acceptanceCriteria?: string;
  owner?: string;
}

export interface CreateProgressLogDto {
  projectId: string;
  workPackageId?: string;
  logDate?: string | Date;
  summary: string;
  physicalProgressPercent: number;
  weather?: string;
  manpowerCount?: number;
  equipmentSummary?: string;
  issues?: string;
  delays?: string;
  nextPlan?: string;
  documentId?: string;
}

export interface SubmitMeasurementDto {
  projectId: string;
  workPackageId: string;
  boqLineId: string;
  measurementDate?: string | Date;
  location?: string;
  measuredQuantity: number;
  uomName: string;
  measurementDetails?: string;
  documentId?: string;
}

export interface VerifyMeasurementDto {
  measurementId: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface CreateProgressCertificateDto {
  projectId: string;
  vendorId: string;
  workPackageId: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  advanceRecovery?: number;
  otherDeductions?: number;
  notes?: string;
  lines: Array<{
    boqLineId: string;
    certifiedQuantity: number;
  }>;
}

export interface CreateVariationDto {
  projectId: string;
  variationType: VariationType;
  reason: string;
  description: string;
  scopeImpact?: string;
  scheduleImpactDays?: number;
  estimatedCostImpact: number;
}

export interface CreateSnagDto {
  projectId: string;
  location?: string;
  title: string;
  description: string;
  severity?: SnagSeverity;
  assignedVendorId?: string;
  dueDate?: string | Date;
  isBlockingHandover?: boolean;
  evidenceDocId?: string;
}

export interface CompleteHandoverDto {
  projectId: string;
  handoverDate?: string | Date;
  handoverFrom: string;
  handoverTo: string;
  warrantyStartDate?: string | Date;
  defectLiabilityStartDate?: string | Date;
  defectLiabilityEndDate?: string | Date;
  checklistData?: any[];
  notes?: string;
  assets?: Array<{
    actionType: AssetHandoverAction;
    targetAssetId?: string;
    assetName: string;
    assetCategoryId: string;
    modelNumber?: string;
    serialNumber?: string;
    locationDescription?: string;
    buildingId?: string;
    unitId?: string;
  }>;
}
