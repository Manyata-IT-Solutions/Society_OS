import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';

// Services
import { SecuritySequenceService } from './security-sequence.service.js';
import { PassCredentialService } from './pass-credential.service.js';
import { SecurityGateService } from './security-gate.service.js';
import { SecurityAccessDecisionService } from './security-access-decision.service.js';
import { VisitorService } from './visitor.service.js';
import { VisitApprovalService } from './visit-approval.service.js';
import { GateAccessService } from './gate-access.service.js';
import { DeliveryCabService } from './delivery-cab.service.js';
import { HouseholdServiceAccessService } from './household-service.service.js';
import { ContractorAccessService } from './contractor-access.service.js';
import { WatchlistService } from './watchlist.service.js';
import { SecurityDashboardService } from './security-dashboard.service.js';

// Controllers
import { SecurityGateController } from './gate.controller.js';
import { VisitorController } from './visitor.controller.js';
import { VisitApprovalController } from './approval.controller.js';
import { GateAccessController } from './access.controller.js';
import { DeliveryController } from './delivery.controller.js';
import { HouseholdServiceController } from './household-service.controller.js';
import { ContractorAccessController } from './contractor-access.controller.js';
import { WatchlistController } from './watchlist.controller.js';
import { SecurityDashboardController } from './security-dashboard.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [
    SecurityGateController,
    VisitorController,
    VisitApprovalController,
    GateAccessController,
    DeliveryController,
    HouseholdServiceController,
    ContractorAccessController,
    WatchlistController,
    SecurityDashboardController,
  ],
  providers: [
    SecuritySequenceService,
    PassCredentialService,
    SecurityGateService,
    SecurityAccessDecisionService,
    VisitorService,
    VisitApprovalService,
    GateAccessService,
    DeliveryCabService,
    HouseholdServiceAccessService,
    ContractorAccessService,
    WatchlistService,
    SecurityDashboardService,
  ],
  exports: [
    SecurityGateService,
    VisitorService,
    GateAccessService,
    SecurityAccessDecisionService,
    SecurityDashboardService,
  ],
})
export class SecurityModule {}
