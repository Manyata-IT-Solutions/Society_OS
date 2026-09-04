import {
  SOSType,
  IncidentType,
  IncidentSeverity,
  IncidentPriority,
  IncidentStatus,
  IncidentSourceType,
  CommandLevel,
  MusterStatus,
  RiskCategory,
  RiskLikelihood,
  RiskImpact,
  FindingSeverity,
  DrillType,
  ComplianceCategory,
  CredentialType,
} from '@community-os/types';

export interface RaiseEmergencySOSDto {
  organizationId: string;
  communityId: string;
  sosType: SOSType;
  initiatorType?: string;
  initiatorId?: string;
  unitId?: string;
  locationDetails?: string;
  message?: string;
}

export interface AcknowledgeSOSDto {
  sosId: string;
  resolutionNotes?: string;
  createIncident?: boolean;
  incidentType?: IncidentType;
  severity?: IncidentSeverity;
}

export interface CreateSafetyIncidentDto {
  organizationId: string;
  communityId: string;
  incidentNumber?: string;
  title: string;
  description: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  priority?: IncidentPriority;
  sourceType?: IncidentSourceType;
  sourceReferenceId?: string;
  buildingId?: string;
  floorId?: string;
  unitId?: string;
  locationDetails?: string;
  assetId?: string;
}

export interface TriageIncidentDto {
  incidentId: string;
  incidentType?: IncidentType;
  severity?: IncidentSeverity;
  priority?: IncidentPriority;
  triageNotes?: string;
}

export interface UpdateIncidentStatusDto {
  incidentId: string;
  status: IncidentStatus;
  notes?: string;
}

export interface ActivateIncidentCommandDto {
  incidentId: string;
  incidentCommanderId: string;
  deputyId?: string;
  commandLevel?: CommandLevel;
  commandPostLocation?: string;
}

export interface TransferIncidentCommandDto {
  incidentId: string;
  newCommanderId: string;
  reason: string;
}

export interface AssignIncidentResponderDto {
  incidentId: string;
  workerId: string;
  teamName: string;
  role: string;
}

export interface CreateIncidentActionDto {
  incidentId: string;
  title: string;
  description?: string;
  ownerId?: string;
  priority?: IncidentPriority;
  dueAt?: string;
}

export interface CompleteIncidentActionDto {
  actionId: string;
  completionNotes?: string;
}

export interface CreateEmergencyPlaybookDto {
  communityId: string;
  incidentType: IncidentType;
  title: string;
  stepsPayload: any[];
  contactsPayload?: any[];
  recommendedSeverity?: IncidentSeverity;
}

export interface CreateEvacuationPlanDto {
  communityId: string;
  name: string;
  scope: string;
  zones: { name: string; buildingId?: string; instructions: string }[];
  musterPoints: { name: string; locationDescription: string; capacity?: number }[];
}

export interface OrderEvacuationDto {
  incidentId: string;
  evacuationPlanId: string;
  scope: string;
  reason: string;
  priority?: string;
}

export interface ConfirmMusterStatusDto {
  sessionId: string;
  subjectType: 'RESIDENT' | 'VISITOR' | 'WORKER' | 'OTHER';
  subjectId: string;
  accountabilityStatus: MusterStatus;
  musterPointId?: string;
  notes?: string;
}

export interface ResidentSelfSafeDto {
  incidentId: string;
  unitId: string;
  residentId: string;
  accountabilityStatus: 'SAFE_AT_MUSTER' | 'SAFE_ELSEWHERE' | 'NOT_ON_SITE';
  needAssistance?: boolean;
  assistanceDetails?: string;
}

export interface CreateIncidentInvestigationDto {
  incidentId: string;
  leadInvestigatorId?: string;
  methodology?: string;
  immediateCause: string;
  rootCause: string;
  contributingFactors?: string[];
  recommendations: string;
}

export interface CreateSafetyCorrectiveActionDto {
  sourceType: string;
  sourceId: string;
  title: string;
  description: string;
  ownerId?: string;
  dueDate: string;
  priority?: string;
  verificationRequired?: boolean;
  linkedWorkOrderId?: string;
}

export interface VerifyCorrectiveActionDto {
  actionId: string;
  verificationOutcome: 'VERIFIED' | 'REJECTED';
  verificationNotes: string;
}

export interface ReportSafetyHazardDto {
  organizationId: string;
  communityId: string;
  title: string;
  description: string;
  category?: string;
  locationDetails?: string;
  severity?: FindingSeverity;
}

export interface AssessSafetyRiskDto {
  organizationId: string;
  communityId: string;
  title: string;
  description: string;
  category: RiskCategory;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  controlsPayload?: any[];
  residualLikelihood?: RiskLikelihood;
  residualImpact?: RiskImpact;
  ownerId?: string;
}

export interface CreateSafetyInspectionDto {
  communityId: string;
  inspectionType: string;
  scope: string;
  scheduledAt: string;
  inspectorId?: string;
  itemsPayload: any[];
}

export interface RecordInspectionFindingDto {
  inspectionId: string;
  itemDescription: string;
  severity: FindingSeverity;
  description: string;
  createCorrectiveAction?: boolean;
}

export interface PlanSafetyDrillDto {
  communityId: string;
  drillType: DrillType;
  title: string;
  scenario: string;
  plannedDate: string;
  objectives: string;
}

export interface CompleteSafetyDrillDto {
  drillId: string;
  evacuationDurationMinutes: number;
  musterCompletionPct: number;
  evaluationNotes: string;
  findings?: { severity: FindingSeverity; description: string }[];
}

export interface CreateComplianceRequirementDto {
  organizationId: string;
  communityId: string;
  code: string;
  title: string;
  description?: string;
  category: ComplianceCategory;
  authorityName?: string;
  reviewFrequency?: string;
}

export interface CreateComplianceObligationDto {
  requirementId: string;
  title: string;
  dueDate: string;
  ownerId?: string;
}

export interface CreateComplianceCredentialDto {
  organizationId: string;
  communityId: string;
  requirementId?: string;
  credentialType: CredentialType;
  credentialNumber: string;
  title: string;
  issuingAuthority: string;
  validFrom: string;
  expiryDate: string;
  assetId?: string;
}

export interface RenewComplianceCredentialDto {
  oldCredentialId: string;
  newCredentialNumber: string;
  validFrom: string;
  expiryDate: string;
}

export interface CreateSafetyPermitDto {
  communityId: string;
  permitType: string;
  location: string;
  hazards: string;
  controls: string;
  validFrom: string;
  validTo: string;
  receiverWorkerId?: string;
}

export interface ApproveSafetyPermitDto {
  permitId: string;
  approved: boolean;
  notes?: string;
}
