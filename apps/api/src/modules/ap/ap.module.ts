import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { DocumentModule } from '../document/document.module.js';
import { FinanceModule } from '../finance/finance.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

import { ApSequenceService } from './ap-sequence.service.js';
import { DuplicateInvoiceDetectorService } from './duplicate-invoice-detector.service.js';
import { InvoiceMatchingEngine } from './invoice-matching.engine.js';
import { VendorAccountRepository } from './vendor-account.repository.js';
import { VendorSubledgerService } from './vendor-subledger.service.js';
import { ApFinancePostingService } from './ap-finance-posting.service.js';
import { RemittanceAdviceService } from './remittance-advice.service.js';
import { ApAgingService } from './ap-aging.service.js';
import { ApIntegrityService } from './ap-integrity.service.js';
import { SupplierInvoiceService } from './supplier-invoice.service.js';
import { SupplierCreditNoteService } from './supplier-credit-note.service.js';
import { PaymentTermsService } from './payment-terms.service.js';
import { PaymentProposalService } from './payment-proposal.service.js';
import { PaymentRunService } from './payment-run.service.js';
import { VendorPaymentService } from './vendor-payment.service.js';
import { VendorAdvanceService } from './vendor-advance.service.js';

import { SupplierInvoiceController } from './supplier-invoice.controller.js';
import { MatchExceptionController } from './match-exception.controller.js';
import { SupplierCreditNoteController } from './supplier-credit-note.controller.js';
import { VendorSubledgerController } from './vendor-subledger.controller.js';
import { ApAgingController } from './ap-aging.controller.js';
import { PaymentTermsController } from './payment-terms.controller.js';
import { PaymentProposalController } from './payment-proposal.controller.js';
import { PaymentRunController } from './payment-run.controller.js';
import { VendorPaymentController } from './vendor-payment.controller.js';
import { VendorAdvanceController } from './vendor-advance.controller.js';
import { ApDashboardController } from './ap-dashboard.controller.js';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    DocumentModule,
    FinanceModule,
    AuthModule,
    AuthorizationModule,
  ],
  controllers: [
    SupplierInvoiceController,
    MatchExceptionController,
    SupplierCreditNoteController,
    VendorSubledgerController,
    ApAgingController,
    PaymentTermsController,
    PaymentProposalController,
    PaymentRunController,
    VendorPaymentController,
    VendorAdvanceController,
    ApDashboardController,
  ],
  providers: [
    ApSequenceService,
    DuplicateInvoiceDetectorService,
    InvoiceMatchingEngine,
    VendorAccountRepository,
    VendorSubledgerService,
    ApFinancePostingService,
    RemittanceAdviceService,
    ApAgingService,
    ApIntegrityService,
    SupplierInvoiceService,
    SupplierCreditNoteService,
    PaymentTermsService,
    PaymentProposalService,
    PaymentRunService,
    VendorPaymentService,
    VendorAdvanceService,
  ],
  exports: [
    SupplierInvoiceService,
    VendorPaymentService,
    VendorSubledgerService,
    ApAgingService,
    ApIntegrityService,
  ],
})
export class AccountsPayableModule {}
