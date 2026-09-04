import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { DocumentModule } from '../document/document.module.js';
import { FinanceModule } from '../finance/finance.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

import { BankAccountService } from './bank-account.service.js';
import { BankStatementImportService } from './bank-statement-import.service.js';
import { BankReconciliationEngine } from './bank-reconciliation.engine.js';
import { TreasuryDashboardService } from './treasury-dashboard.service.js';

import { BankAccountController } from './bank-account.controller.js';
import { BankStatementController } from './bank-statement.controller.js';
import { BankTransactionController } from './bank-transaction.controller.js';
import { BankReconciliationController } from './bank-reconciliation.controller.js';
import { TreasuryDashboardController } from './treasury-dashboard.controller.js';

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
    BankAccountController,
    BankStatementController,
    BankTransactionController,
    BankReconciliationController,
    TreasuryDashboardController,
  ],
  providers: [
    BankAccountService,
    BankStatementImportService,
    BankReconciliationEngine,
    TreasuryDashboardService,
  ],
  exports: [
    BankAccountService,
    BankStatementImportService,
    BankReconciliationEngine,
    TreasuryDashboardService,
  ],
})
export class TreasuryModule {}
