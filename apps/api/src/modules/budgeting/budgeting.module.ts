import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BudgetSequenceService } from './budget-sequence.service.js';
import { BudgetResolverService } from './budget-resolver.service.js';
import { BudgetControlEngine } from './budget-control.engine.js';
import { BudgetCommitmentService } from './budget-commitment.service.js';
import { BudgetBalanceProjectionService } from './budget-balance-projection.service.js';
import { BudgetService } from './budget.service.js';
import { BudgetTemplateService } from './budget-template.service.js';
import { BudgetAmendmentService } from './budget-amendment.service.js';
import { BudgetTransferService } from './budget-transfer.service.js';
import { CapexPlanningService } from './capex-planning.service.js';
import { FundPlanningService } from './fund-planning.service.js';
import { ForecastingService } from './forecasting.service.js';
import { VarianceAnalysisService } from './variance-analysis.service.js';
import { BudgetDashboardService } from './budget-dashboard.service.js';

import { BudgetController } from './budget.controller.js';
import { BudgetTemplateController } from './budget-template.controller.js';
import { BudgetAmendmentController } from './budget-amendment.controller.js';
import { BudgetTransferController } from './budget-transfer.controller.js';
import { BudgetControlController } from './budget-control.controller.js';
import { BudgetCommitmentController } from './budget-commitment.controller.js';
import { CapexController } from './capex.controller.js';
import { FundPlanController } from './fund-plan.controller.js';
import { ForecastController } from './forecast.controller.js';
import { VarianceController } from './variance.controller.js';
import { BudgetDashboardController } from './budget-dashboard.controller.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuthModule],
  controllers: [
    BudgetController,
    BudgetTemplateController,
    BudgetAmendmentController,
    BudgetTransferController,
    BudgetControlController,
    BudgetCommitmentController,
    CapexController,
    FundPlanController,
    ForecastController,
    VarianceController,
    BudgetDashboardController,
  ],
  providers: [
    BudgetSequenceService,
    BudgetResolverService,
    BudgetControlEngine,
    BudgetCommitmentService,
    BudgetBalanceProjectionService,
    BudgetService,
    BudgetTemplateService,
    BudgetAmendmentService,
    BudgetTransferService,
    CapexPlanningService,
    FundPlanningService,
    ForecastingService,
    VarianceAnalysisService,
    BudgetDashboardService,
  ],
  exports: [
    BudgetSequenceService,
    BudgetResolverService,
    BudgetControlEngine,
    BudgetCommitmentService,
    BudgetBalanceProjectionService,
    BudgetService,
    BudgetTemplateService,
    BudgetAmendmentService,
    BudgetTransferService,
    CapexPlanningService,
    FundPlanningService,
    ForecastingService,
    VarianceAnalysisService,
    BudgetDashboardService,
  ],
})
export class BudgetingModule {}
