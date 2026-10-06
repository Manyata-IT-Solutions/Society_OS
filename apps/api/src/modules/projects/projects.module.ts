import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { BudgetingModule } from '../budgeting/budgeting.module.js';

import { ProjectSequenceService } from './project-sequence.service.js';
import { ProjectService } from './project.service.js';
import { BoqService } from './boq.service.js';
import { WorkPackageService } from './work-package.service.js';
import { MeasurementService } from './measurement.service.js';
import { CertificationService } from './certification.service.js';
import { ProjectVariationService } from './project-variation.service.js';
import { QualitySnagService } from './quality-snag.service.js';
import { ProjectHandoverService } from './project-handover.service.js';
import { ProjectFinancialsService } from './project-financials.service.js';

import { ProjectController } from './project.controller.js';
import { BoqController } from './boq.controller.js';
import { WorkPackageController } from './work-package.controller.js';
import { MeasurementController } from './measurement.controller.js';
import { CertificationController } from './certification.controller.js';
import { VariationController } from './variation.controller.js';
import { SnagController } from './snag.controller.js';
import { HandoverController } from './handover.controller.js';
import { ProjectDashboardController } from './project-dashboard.controller.js';

@Module({
  imports: [DatabaseModule, BudgetingModule],
  providers: [
    ProjectSequenceService,
    ProjectService,
    BoqService,
    WorkPackageService,
    MeasurementService,
    CertificationService,
    ProjectVariationService,
    QualitySnagService,
    ProjectHandoverService,
    ProjectFinancialsService,
  ],
  controllers: [
    ProjectController,
    BoqController,
    WorkPackageController,
    MeasurementController,
    CertificationController,
    VariationController,
    SnagController,
    HandoverController,
    ProjectDashboardController,
  ],
  exports: [
    ProjectService,
    BoqService,
    MeasurementService,
    CertificationService,
    ProjectFinancialsService,
  ],
})
export class ProjectsModule {}
