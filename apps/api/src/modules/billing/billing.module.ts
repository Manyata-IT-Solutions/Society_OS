import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { FinanceModule } from '../finance/finance.module.js';

// Repositories
import { BillableAccountRepository } from './billable-account.repository.js';
import { BillingPlanRepository } from './billing-plan.repository.js';
import { ChargeDefinitionRepository } from './charge-definition.repository.js';
import { BillingPeriodRepository } from './billing-period.repository.js';
import { BillingRunRepository } from './billing-run.repository.js';
import { InvoiceRepository } from './invoice.repository.js';
import { PaymentRepository } from './payment.repository.js';
import { ReceiptRepository } from './receipt.repository.js';
import { ResidentAccountRepository } from './resident-account.repository.js';

// Services
import { BillingSequenceService } from './billing-sequence.service.js';
import { LiabilityResolverService } from './liability-resolver.service.js';
import { ChargeCalculatorService } from './charge-calculator.service.js';
import { BillingFinancePostingService } from './billing-finance-posting.service.js';
import { InvoiceDocumentService } from './invoice-document.service.js';
import { InvoiceService } from './invoice.service.js';
import { ReceiptService } from './receipt.service.js';
import { PaymentAllocationService } from './payment-allocation.service.js';
import { PaymentService } from './payment.service.js';
import { PaymentReversalService } from './payment-reversal.service.js';
import { ResidentLedgerService } from './resident-ledger.service.js';
import { BillingRunService } from './billing-run.service.js';
import { WaiverService } from './waiver.service.js';
import { PenaltyInterestService } from './penalty-interest.service.js';
import { AgingCollectionService } from './aging-collection.service.js';
import { BillingMigrationService } from './billing-migration.service.js';

// Controllers
import { BillableAccountController } from './billable-account.controller.js';
import { BillingPlanController } from './billing-plan.controller.js';
import { ChargeDefinitionController } from './charge-definition.controller.js';
import { BillingPeriodController } from './billing-period.controller.js';
import { BillingRunController } from './billing-run.controller.js';
import { InvoiceController } from './invoice.controller.js';
import { PaymentController } from './payment.controller.js';
import { ReceiptController } from './receipt.controller.js';
import { ResidentLedgerController } from './resident-ledger.controller.js';
import { WaiverController } from './waiver.controller.js';
import { AgingCollectionController } from './aging-collection.controller.js';
import { BillingMigrationController } from './billing-migration.controller.js';

import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

@Module({
  imports: [DatabaseModule, EventsModule, FinanceModule, AuthModule, AuthorizationModule],
  providers: [
    BillableAccountRepository,
    BillingPlanRepository,
    ChargeDefinitionRepository,
    BillingPeriodRepository,
    BillingRunRepository,
    InvoiceRepository,
    PaymentRepository,
    ReceiptRepository,
    ResidentAccountRepository,
    BillingSequenceService,
    LiabilityResolverService,
    ChargeCalculatorService,
    BillingFinancePostingService,
    InvoiceDocumentService,
    InvoiceService,
    ReceiptService,
    PaymentAllocationService,
    PaymentService,
    PaymentReversalService,
    ResidentLedgerService,
    BillingRunService,
    WaiverService,
    PenaltyInterestService,
    AgingCollectionService,
    BillingMigrationService,
  ],
  controllers: [
    BillableAccountController,
    BillingPlanController,
    ChargeDefinitionController,
    BillingPeriodController,
    BillingRunController,
    InvoiceController,
    PaymentController,
    ReceiptController,
    ResidentLedgerController,
    WaiverController,
    AgingCollectionController,
    BillingMigrationController,
  ],
  exports: [
    InvoiceService,
    PaymentService,
    ReceiptService,
    BillingRunService,
    ResidentLedgerService,
    LiabilityResolverService,
  ],
})
export class BillingModule {}
