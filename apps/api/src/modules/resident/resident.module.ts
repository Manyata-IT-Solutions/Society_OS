import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

import { ResidentRepository } from './resident.repository.js';
import { HouseholdRepository } from './household.repository.js';
import { OwnershipRepository } from './ownership.repository.js';
import { TenancyRepository } from './tenancy.repository.js';
import { OccupancyRepository } from './occupancy.repository.js';
import { ResidentImportJobRepository } from './resident-import-job.repository.js';

import { ResidentService } from './resident.service.js';
import { HouseholdService } from './household.service.js';
import { OwnershipService } from './ownership.service.js';
import { OccupancyService } from './occupancy.service.js';
import { UnitAccessResolver } from './unit-access-resolver.service.js';
import { ResidentImportExportService } from './resident-import-export.service.js';

import { ResidentsController } from './residents.controller.js';
import { HouseholdsController } from './households.controller.js';
import { OwnershipController } from './ownership.controller.js';
import { TenanciesController } from './tenancies.controller.js';
import { OccupanciesController } from './occupancies.controller.js';
import { ResidentImportExportController } from './resident-import-export.controller.js';

@Module({
  imports: [DatabaseModule, EventsModule, LoggerModule, AuthorizationModule],
  controllers: [
    ResidentsController,
    HouseholdsController,
    OwnershipController,
    TenanciesController,
    OccupanciesController,
    ResidentImportExportController,
  ],
  providers: [
    ResidentRepository,
    HouseholdRepository,
    OwnershipRepository,
    TenancyRepository,
    OccupancyRepository,
    ResidentImportJobRepository,
    ResidentService,
    HouseholdService,
    OwnershipService,
    OccupancyService,
    UnitAccessResolver,
    ResidentImportExportService,
  ],
  exports: [
    ResidentService,
    HouseholdService,
    OwnershipService,
    OccupancyService,
    UnitAccessResolver,
    ResidentImportExportService,
    ResidentRepository,
    HouseholdRepository,
    OwnershipRepository,
    TenancyRepository,
    OccupancyRepository,
  ],
})
export class ResidentModule {}
