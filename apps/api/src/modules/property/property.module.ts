import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { OrganizationModule } from '../organization/organization.module.js';
import { CommunityModule } from '../community/community.module.js';

// Repositories
import { PortfolioRepository } from './portfolio.repository.js';
import { SectionRepository } from './section.repository.js';
import { BuildingRepository } from './building.repository.js';
import { FloorRepository } from './floor.repository.js';
import { UnitRepository } from './unit.repository.js';
import { PropertyImportJobRepository } from './property-import-job.repository.js';

// Services
import { PortfolioService } from './portfolio.service.js';
import { PropertyHierarchyService } from './property-hierarchy.service.js';
import { BuildingService } from './building.service.js';
import { UnitService } from './unit.service.js';
import { BulkUnitService } from './bulk-unit.service.js';
import { PropertyImportExportService } from './property-import-export.service.js';

// Controllers
import { PortfoliosController } from './portfolios.controller.js';
import { SectionsController } from './sections.controller.js';
import { BuildingsController } from './buildings.controller.js';
import { FloorsController } from './floors.controller.js';
import { UnitsController } from './units.controller.js';
import { PropertyHierarchyController } from './property-hierarchy.controller.js';
import { PropertyImportExportController } from './property-import-export.controller.js';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    LoggerModule,
    AuthModule,
    AuthorizationModule,
    OrganizationModule,
    CommunityModule,
  ],
  controllers: [
    PortfoliosController,
    SectionsController,
    BuildingsController,
    FloorsController,
    UnitsController,
    PropertyHierarchyController,
    PropertyImportExportController,
  ],
  providers: [
    PortfolioRepository,
    SectionRepository,
    BuildingRepository,
    FloorRepository,
    UnitRepository,
    PropertyImportJobRepository,
    PortfolioService,
    PropertyHierarchyService,
    BuildingService,
    UnitService,
    BulkUnitService,
    PropertyImportExportService,
  ],
  exports: [
    PortfolioRepository,
    SectionRepository,
    BuildingRepository,
    FloorRepository,
    UnitRepository,
    PropertyImportJobRepository,
    PortfolioService,
    PropertyHierarchyService,
    BuildingService,
    UnitService,
    BulkUnitService,
    PropertyImportExportService,
  ],
})
export class PropertyModule {}
