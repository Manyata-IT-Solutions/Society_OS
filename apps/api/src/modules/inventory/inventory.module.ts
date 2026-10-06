import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuditModule } from '../audit/audit.module.js';

import { InventorySequenceService } from './inventory-sequence.service.js';
import { InventoryUomRepository } from './inventory-uom.repository.js';
import { InventoryUomService } from './inventory-uom.service.js';
import { InventoryUomController } from './inventory-uom.controller.js';

import { InventoryCategoryRepository } from './inventory-category.repository.js';
import { InventoryCategoryService } from './inventory-category.service.js';
import { InventoryCategoryController } from './inventory-category.controller.js';

import { InventoryStoreRepository } from './inventory-store.repository.js';
import { InventoryStoreService } from './inventory-store.service.js';
import { InventoryStoreController } from './inventory-store.controller.js';

import { StockLedgerRepository } from './stock-ledger.repository.js';
import { StockLedgerService } from './stock-ledger.service.js';

import { StockBalanceRepository } from './stock-balance.repository.js';
import { StockBalanceService } from './stock-balance.service.js';
import { StockBalanceController } from './stock-balance.controller.js';

import { InventoryItemRepository } from './inventory-item.repository.js';
import { InventoryItemService } from './inventory-item.service.js';
import { InventoryItemController } from './inventory-item.controller.js';

import { InventoryReceiptRepository } from './inventory-receipt.repository.js';
import { InventoryReceiptService } from './inventory-receipt.service.js';
import { InventoryReceiptController } from './inventory-receipt.controller.js';

import { StockReservationRepository } from './stock-reservation.repository.js';
import { StockReservationService } from './stock-reservation.service.js';

import { InventoryIssueRepository } from './inventory-issue.repository.js';
import { InventoryIssueService } from './inventory-issue.service.js';
import { InventoryIssueController } from './inventory-issue.controller.js';

import { WorkOrderMaterialRepository } from './work-order-material.repository.js';
import { WorkOrderMaterialService } from './work-order-material.service.js';
import { WorkOrderMaterialController } from './work-order-material.controller.js';

import { InventoryReturnRepository } from './inventory-return.repository.js';
import { InventoryReturnService } from './inventory-return.service.js';
import { InventoryReturnController } from './inventory-return.controller.js';

import { StockTransferRepository } from './stock-transfer.repository.js';
import { StockTransferService } from './stock-transfer.service.js';
import { StockTransferController } from './stock-transfer.controller.js';

import { StockAdjustmentRepository } from './stock-adjustment.repository.js';
import { StockAdjustmentService } from './stock-adjustment.service.js';
import { StockAdjustmentController } from './stock-adjustment.controller.js';

import { StockCountRepository } from './stock-count.repository.js';
import { StockCountService } from './stock-count.service.js';
import { StockCountController } from './stock-count.controller.js';

import { InventoryBatchRepository } from './inventory-batch.repository.js';
import { InventoryBatchService } from './inventory-batch.service.js';
import { InventoryBatchController } from './inventory-batch.controller.js';

import { InventorySerialRepository } from './inventory-serial.repository.js';
import { InventorySerialService } from './inventory-serial.service.js';
import { InventorySerialController } from './inventory-serial.controller.js';

import { InventoryIdentifierController } from './inventory-identifier.controller.js';
import { InventoryImportService } from './inventory-import.service.js';
import { InventoryImportController } from './inventory-import.controller.js';
import { InventorySweeperService } from './inventory-sweeper.service.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuditModule],
  controllers: [
    InventoryIdentifierController,
    InventoryImportController,
    InventoryUomController,
    InventoryCategoryController,
    InventoryStoreController,
    StockBalanceController,
    InventoryReceiptController,
    InventoryIssueController,
    WorkOrderMaterialController,
    InventoryReturnController,
    StockTransferController,
    StockAdjustmentController,
    StockCountController,
    InventoryBatchController,
    InventorySerialController,
    InventoryItemController,
  ],
  providers: [
    InventorySequenceService,
    InventoryUomRepository,
    InventoryUomService,
    InventoryCategoryRepository,
    InventoryCategoryService,
    InventoryStoreRepository,
    InventoryStoreService,
    StockLedgerRepository,
    StockLedgerService,
    StockBalanceRepository,
    StockBalanceService,
    InventoryItemRepository,
    InventoryItemService,
    InventoryReceiptRepository,
    InventoryReceiptService,
    StockReservationRepository,
    StockReservationService,
    InventoryIssueRepository,
    InventoryIssueService,
    WorkOrderMaterialRepository,
    WorkOrderMaterialService,
    InventoryReturnRepository,
    InventoryReturnService,
    StockTransferRepository,
    StockTransferService,
    StockAdjustmentRepository,
    StockAdjustmentService,
    StockCountRepository,
    StockCountService,
    InventoryBatchRepository,
    InventoryBatchService,
    InventorySerialRepository,
    InventorySerialService,
    InventoryImportService,
    InventorySweeperService,
  ],
  exports: [
    InventorySequenceService,
    InventoryUomService,
    InventoryCategoryService,
    InventoryStoreService,
    StockLedgerService,
    StockBalanceService,
    InventoryItemService,
    InventoryReceiptService,
    StockReservationService,
    InventoryIssueService,
    WorkOrderMaterialService,
    InventoryReturnService,
    StockTransferService,
    StockAdjustmentService,
    StockCountService,
    InventoryBatchService,
    InventorySerialService,
  ],
})
export class InventoryModule {}
