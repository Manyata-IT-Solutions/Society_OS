import { Module } from '@nestjs/common';
import { ProcurementSequenceService } from './sequence.service.js';
import { PurchaseRequisitionRepository } from './purchase-requisition.repository.js';
import { PurchaseRequisitionService } from './purchase-requisition.service.js';
import { PurchaseRequisitionController } from './purchase-requisition.controller.js';
import { RfqRepository } from './rfq.repository.js';
import { RfqService } from './rfq.service.js';
import { RfqController } from './rfq.controller.js';
import { VendorQuotationRepository } from './vendor-quotation.repository.js';
import { QuotationComparisonService } from './quotation-comparison.service.js';
import { VendorQuotationService } from './vendor-quotation.service.js';
import { VendorQuotationController } from './vendor-quotation.controller.js';
import { SourcingAwardRepository } from './sourcing-award.repository.js';
import { SourcingAwardService } from './sourcing-award.service.js';
import { SourcingAwardController } from './sourcing-award.controller.js';
import { PurchaseOrderRepository } from './purchase-order.repository.js';
import { PurchaseOrderService } from './purchase-order.service.js';
import { PurchaseOrderController } from './purchase-order.controller.js';
import { GoodsReceiptNoteRepository } from './goods-receipt-note.repository.js';
import { GoodsReceiptNoteService } from './goods-receipt-note.service.js';
import { GoodsReceiptNoteController } from './goods-receipt-note.controller.js';
import { ServiceReceiptRepository } from './service-receipt.repository.js';
import { ServiceReceiptService } from './service-receipt.service.js';
import { ServiceReceiptController } from './service-receipt.controller.js';
import { ProcurementAnalyticsService } from './procurement-analytics.service.js';
import { ProcurementAnalyticsController } from './procurement-analytics.controller.js';
import { VendorModule } from '../vendor/vendor.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuditModule, VendorModule, InventoryModule],
  providers: [
    ProcurementSequenceService,
    PurchaseRequisitionRepository,
    PurchaseRequisitionService,
    RfqRepository,
    RfqService,
    VendorQuotationRepository,
    QuotationComparisonService,
    VendorQuotationService,
    SourcingAwardRepository,
    SourcingAwardService,
    PurchaseOrderRepository,
    PurchaseOrderService,
    GoodsReceiptNoteRepository,
    GoodsReceiptNoteService,
    ServiceReceiptRepository,
    ServiceReceiptService,
    ProcurementAnalyticsService,
  ],
  controllers: [
    PurchaseRequisitionController,
    RfqController,
    VendorQuotationController,
    SourcingAwardController,
    PurchaseOrderController,
    GoodsReceiptNoteController,
    ServiceReceiptController,
    ProcurementAnalyticsController,
  ],
  exports: [
    PurchaseRequisitionService,
    RfqService,
    VendorQuotationService,
    SourcingAwardService,
    PurchaseOrderService,
    GoodsReceiptNoteService,
    ServiceReceiptService,
    ProcurementAnalyticsService,
  ],
})
export class ProcurementModule {}
