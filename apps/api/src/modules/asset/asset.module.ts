import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuditModule } from '../audit/audit.module.js';

import { AssetSequenceService } from './asset-sequence.service.js';
import { AssetCategoryRepository } from './asset-category.repository.js';
import { AssetCategoryService } from './asset-category.service.js';
import { AssetCategoryController } from './asset-category.controller.js';

import { AssetModelRepository } from './asset-model.repository.js';
import { AssetModelService } from './asset-model.service.js';
import { AssetModelController } from './asset-model.controller.js';

import { AssetRepository } from './asset.repository.js';
import { AssetService } from './asset.service.js';
import { AssetController } from './asset.controller.js';

import { AssetWarrantyRepository } from './asset-warranty.repository.js';
import { AssetWarrantyService } from './asset-warranty.service.js';
import { AssetWarrantyController } from './asset-warranty.controller.js';

import { AssetContractRepository } from './asset-contract.repository.js';
import { AssetContractService } from './asset-contract.service.js';
import { AssetContractController } from './asset-contract.controller.js';

import { AssetMeterRepository } from './asset-meter.repository.js';
import { AssetMeterService } from './asset-meter.service.js';
import { AssetMeterController } from './asset-meter.controller.js';

import { AssetIdentifierController } from './asset-identifier.controller.js';
import { AssetImportService } from './asset-import.service.js';
import { AssetImportController } from './asset-import.controller.js';
import { AssetSweeperService } from './asset-sweeper.service.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuditModule],
  controllers: [
    AssetCategoryController,
    AssetModelController,
    AssetIdentifierController,
    AssetImportController,
    AssetWarrantyController,
    AssetContractController,
    AssetMeterController,
    AssetController,
  ],
  providers: [
    AssetSequenceService,
    AssetCategoryRepository,
    AssetCategoryService,
    AssetModelRepository,
    AssetModelService,
    AssetRepository,
    AssetService,
    AssetWarrantyRepository,
    AssetWarrantyService,
    AssetContractRepository,
    AssetContractService,
    AssetMeterRepository,
    AssetMeterService,
    AssetImportService,
    AssetSweeperService,
  ],
  exports: [
    AssetSequenceService,
    AssetCategoryService,
    AssetModelService,
    AssetService,
    AssetWarrantyService,
    AssetContractService,
    AssetMeterService,
    AssetImportService,
    AssetSweeperService,
    AssetRepository,
    AssetCategoryRepository,
    AssetModelRepository,
  ],
})
export class AssetModule {}
