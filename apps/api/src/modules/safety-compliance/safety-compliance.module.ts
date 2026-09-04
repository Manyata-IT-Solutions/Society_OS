import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';

// Services
import { SafetySequenceService } from './safety-sequence.service.js';
import { EmergencySOSService } from './emergency-sos.service.js';
import { IncidentManagementService } from './incident-management.service.js';
import { IncidentCommandService } from './incident-command.service.js';
import { IncidentActionService } from './incident-action.service.js';
import { EmergencyPlaybookService } from './emergency-playbook.service.js';
import { EvacuationService } from './evacuation.service.js';
import { MusterService } from './muster.service.js';
import { IncidentInvestigationService } from './incident-investigation.service.js';
import { SafetyCAPAService } from './safety-capa.service.js';
import { HazardRiskService } from './hazard-risk.service.js';
import { SafetyInspectionService } from './safety-inspection.service.js';
import { SafetyDrillService } from './safety-drill.service.js';
import { ComplianceRequirementService } from './compliance-requirement.service.js';
import { ComplianceCredentialService } from './compliance-credential.service.js';
import { SafetyPermitService } from './safety-permit.service.js';
import { EmergencyContactService } from './emergency-contact.service.js';
import { EmergencyIntegrityService } from './emergency-integrity.service.js';
import { SafetyDashboardService } from './safety-dashboard.service.js';

// Controllers
import { EmergencySOSController } from './sos.controller.js';
import { SafetyIncidentsController } from './incidents.controller.js';
import { IncidentCommandController } from './command.controller.js';
import { IncidentActionsController } from './actions.controller.js';
import { EmergencyPlaybooksController } from './playbooks.controller.js';
import { EvacuationController } from './evacuation.controller.js';
import { MusterController } from './muster.controller.js';
import { IncidentInvestigationsController } from './investigations.controller.js';
import { SafetyCAPAController } from './capa.controller.js';
import { HazardsRisksController } from './hazards-risks.controller.js';
import { SafetyInspectionsController } from './inspections.controller.js';
import { SafetyDrillsController } from './drills.controller.js';
import { ComplianceController } from './compliance.controller.js';
import { ComplianceCredentialsController } from './credentials.controller.js';
import { SafetyPermitsController } from './permits.controller.js';
import { EmergencyContactsController } from './contacts.controller.js';
import { SafetyDashboardController } from './dashboard.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    EmergencySOSController,
    SafetyIncidentsController,
    IncidentCommandController,
    IncidentActionsController,
    EmergencyPlaybooksController,
    EvacuationController,
    MusterController,
    IncidentInvestigationsController,
    SafetyCAPAController,
    HazardsRisksController,
    SafetyInspectionsController,
    SafetyDrillsController,
    ComplianceController,
    ComplianceCredentialsController,
    SafetyPermitsController,
    EmergencyContactsController,
    SafetyDashboardController,
  ],
  providers: [
    SafetySequenceService,
    EmergencySOSService,
    IncidentManagementService,
    IncidentCommandService,
    IncidentActionService,
    EmergencyPlaybookService,
    EvacuationService,
    MusterService,
    IncidentInvestigationService,
    SafetyCAPAService,
    HazardRiskService,
    SafetyInspectionService,
    SafetyDrillService,
    ComplianceRequirementService,
    ComplianceCredentialService,
    SafetyPermitService,
    EmergencyContactService,
    EmergencyIntegrityService,
    SafetyDashboardService,
  ],
  exports: [
    SafetySequenceService,
    EmergencySOSService,
    IncidentManagementService,
    IncidentCommandService,
    IncidentActionService,
    EmergencyPlaybookService,
    EvacuationService,
    MusterService,
    IncidentInvestigationService,
    SafetyCAPAService,
    HazardRiskService,
    SafetyInspectionService,
    SafetyDrillService,
    ComplianceRequirementService,
    ComplianceCredentialService,
    SafetyPermitService,
    EmergencyContactService,
    EmergencyIntegrityService,
    SafetyDashboardService,
  ],
})
export class SafetyComplianceModule {}
