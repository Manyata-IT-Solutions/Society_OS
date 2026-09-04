import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

// Repositories
import { AccountingEntityRepository } from './accounting-entity.repository.js';
import { FiscalCalendarRepository } from './fiscal-calendar.repository.js';
import { ChartOfAccountsRepository } from './chart-of-accounts.repository.js';
import { CostCenterRepository } from './cost-center.repository.js';
import { FundRepository } from './fund.repository.js';
import { JournalEntryRepository } from './journal-entry.repository.js';

// Services
import { FinancialSequenceService } from './financial-sequence.service.js';
import { FinancialPostingService } from './financial-posting.service.js';
import { AccountingEntityService } from './accounting-entity.service.js';
import { FiscalCalendarService } from './fiscal-calendar.service.js';
import { ChartOfAccountsService } from './chart-of-accounts.service.js';
import { CostCenterService } from './cost-center.service.js';
import { FundService } from './fund.service.js';
import { JournalEntryService } from './journal-entry.service.js';
import { GeneralLedgerService } from './general-ledger.service.js';
import { FinancialReportingService } from './financial-reporting.service.js';
import { FinancialIntegrityService } from './financial-integrity.service.js';

// Controllers
import { AccountingEntityController } from './accounting-entity.controller.js';
import { FiscalCalendarController } from './fiscal-calendar.controller.js';
import { ChartOfAccountsController } from './chart-of-accounts.controller.js';
import { CostCenterController } from './cost-center.controller.js';
import { FundController } from './fund.controller.js';
import { JournalEntryController } from './journal-entry.controller.js';
import { GeneralLedgerController } from './general-ledger.controller.js';
import { FinancialReportingController } from './financial-reporting.controller.js';
import { FinancialIntegrityController } from './financial-integrity.controller.js';

@Module({
  imports: [DatabaseModule, EventsModule, AuditModule, AuthModule, AuthorizationModule],
  controllers: [
    AccountingEntityController,
    FiscalCalendarController,
    ChartOfAccountsController,
    CostCenterController,
    FundController,
    JournalEntryController,
    GeneralLedgerController,
    FinancialReportingController,
    FinancialIntegrityController,
  ],
  providers: [
    AccountingEntityRepository,
    FiscalCalendarRepository,
    ChartOfAccountsRepository,
    CostCenterRepository,
    FundRepository,
    JournalEntryRepository,
    FinancialSequenceService,
    FinancialPostingService,
    AccountingEntityService,
    FiscalCalendarService,
    ChartOfAccountsService,
    CostCenterService,
    FundService,
    JournalEntryService,
    GeneralLedgerService,
    FinancialReportingService,
    FinancialIntegrityService,
  ],
  exports: [
    FinancialSequenceService,
    AccountingEntityService,
    FiscalCalendarService,
    ChartOfAccountsService,
    FinancialPostingService,
    JournalEntryService,
    GeneralLedgerService,
    FinancialReportingService,
  ],
})
export class FinanceModule {}
