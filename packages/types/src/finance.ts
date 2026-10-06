export type AccountingEntityStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type AccountType = 'ASSET' | 'LIABILITY' | 'FUND_BALANCE' | 'INCOME' | 'EXPENSE';

export type AccountSubType =
  | 'CASH'
  | 'BANK'
  | 'ACCOUNTS_RECEIVABLE'
  | 'RESIDENT_ADVANCE'
  | 'SECURITY_DEPOSIT'
  | 'INVENTORY'
  | 'FIXED_ASSET'
  | 'OTHER_CURRENT_ASSET'
  | 'ACCOUNTS_PAYABLE'
  | 'VENDOR_ADVANCE'
  | 'TAX_PAYABLE'
  | 'ACCRUED_LIABILITY'
  | 'OTHER_CURRENT_LIABILITY'
  | 'MAINTENANCE_INCOME'
  | 'INTEREST_INCOME'
  | 'AMENITY_INCOME'
  | 'PENALTY_INCOME'
  | 'OTHER_INCOME'
  | 'REPAIRS_EXPENSE'
  | 'UTILITIES_EXPENSE'
  | 'SECURITY_EXPENSE'
  | 'HOUSEKEEPING_EXPENSE'
  | 'ADMIN_EXPENSE'
  | 'PROFESSIONAL_FEES'
  | 'INSURANCE_EXPENSE'
  | 'OTHER_EXPENSE';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export type FiscalYearStatus = 'OPEN' | 'CLOSING' | 'CLOSED';

export type PeriodStatus = 'OPEN' | 'SOFT_CLOSED' | 'HARD_CLOSED';

export type FundType = 'OPERATING' | 'SINKING' | 'CORPUS' | 'RESERVE' | 'SPECIAL_PURPOSE';

export type FundRestrictionType = 'UNRESTRICTED' | 'RESTRICTED' | 'DESIGNATED';

export type JournalType =
  | 'GENERAL'
  | 'OPENING'
  | 'ADJUSTMENT'
  | 'ACCRUAL'
  | 'REVERSAL'
  | 'SYSTEM'
  | 'RECLASSIFICATION'
  | 'RECURRING';

export type JournalStatus =
  'DRAFT' | 'SUBMITTED' | 'UNDER_APPROVAL' | 'APPROVED' | 'POSTED' | 'REVERSED' | 'CANCELLED';

export type FinancialDimensionType =
  'COST_CENTER' | 'FUND' | 'BUILDING' | 'PROJECT' | 'DEPARTMENT' | 'VENDOR' | 'RESIDENT';

export type FinancialIntegrityCheckType =
  | 'JOURNAL_BALANCE'
  | 'LEDGER_LINK'
  | 'TOTAL_CONSISTENCY'
  | 'PROJECTION_RECONCILIATION'
  | 'PERIOD_STATUS'
  | 'CROSS_ENTITY'
  | 'DUPLICATE_SOURCE'
  | 'ORPHAN_ENTRY';

export interface AccountingEntity {
  id: string;
  organizationId: string;
  communityId?: string | null;
  code: string;
  name: string;
  legalName: string;
  countryCode: string;
  baseCurrency: string;
  timezone: string;
  status: AccountingEntityStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface FiscalCalendar {
  id: string;
  accountingEntityId: string;
  name: string;
  fiscalStartMonth: number;
  fiscalStartDay: number;
  isDefault: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FiscalYear {
  id: string;
  accountingEntityId: string;
  fiscalCalendarId: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: FiscalYearStatus;
  closedAt?: Date | string | null;
  closedById?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
  periods?: AccountingPeriod[];
}

export interface AccountingPeriod {
  id: string;
  fiscalYearId: string;
  periodNumber: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: PeriodStatus;
  closedAt?: Date | string | null;
  closedById?: string | null;
  softClosedAt?: Date | string | null;
  softClosedById?: string | null;
  reopenedAt?: Date | string | null;
  reopenedById?: string | null;
  reopenReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface LedgerAccount {
  id: string;
  accountingEntityId: string;
  accountCode: string;
  name: string;
  description?: string | null;
  accountType: AccountType;
  accountSubType: AccountSubType;
  parentAccountId?: string | null;
  postingAllowed: boolean;
  normalBalance: NormalBalance;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  systemAccountKey?: string | null;
  isControlAccount: boolean;
  allowManualPosting: boolean;
  reconciliationRequired: boolean;
  currencyRestriction?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
  children?: LedgerAccount[];
}

export interface AccountMapping {
  id: string;
  accountingEntityId: string;
  mappingKey: string;
  accountId: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CostCenter {
  id: string;
  accountingEntityId: string;
  code: string;
  name: string;
  description?: string | null;
  parentCostCenterId?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
  children?: CostCenter[];
}

export interface Fund {
  id: string;
  accountingEntityId: string;
  code: string;
  name: string;
  description?: string | null;
  fundType: FundType;
  restrictionType: FundRestrictionType;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  lineNumber: number;
  accountId: string;
  description: string;
  debitAmount: number | string;
  creditAmount: number | string;
  baseAmount: number | string;
  costCenterId?: string | null;
  fundId?: string | null;
  partyType?: string | null;
  partyId?: string | null;
  dimensions?: Record<string, any>;
  sourceLineReference?: string | null;
  createdAt?: Date | string;
  account?: LedgerAccount;
  costCenter?: CostCenter | null;
  fund?: Fund | null;
}

export interface JournalEntry {
  id: string;
  accountingEntityId: string;
  journalNumber: string;
  journalType: JournalType;
  journalDate: Date | string;
  fiscalYearId: string;
  accountingPeriodId: string;
  status: JournalStatus;
  description: string;
  reference?: string | null;
  sourceModule?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  postingPurpose?: string | null;
  currency: string;
  exchangeRate?: number | string | null;
  totalDebit: number | string;
  totalCredit: number | string;
  idempotencyKey?: string | null;
  workflowInstanceId?: string | null;
  approvalRequestId?: string | null;
  postedAt?: Date | string | null;
  postedById?: string | null;
  reversedAt?: Date | string | null;
  reversalJournalId?: string | null;
  createdById?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
  lines?: JournalLine[];
}

export interface GeneralLedgerEntry {
  id: string;
  accountingEntityId: string;
  journalEntryId: string;
  journalLineId: string;
  accountId: string;
  postingDate: Date | string;
  fiscalYearId: string;
  periodId: string;
  debitAmount: number | string;
  creditAmount: number | string;
  baseAmount: number | string;
  costCenterId?: string | null;
  fundId?: string | null;
  sourceModule?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  postedAt: Date | string;
  sequence: bigint | number | string;
  account?: LedgerAccount;
  costCenter?: CostCenter | null;
  fund?: Fund | null;
}

export interface AccountBalance {
  id: string;
  accountingEntityId: string;
  accountId: string;
  fiscalYearId: string;
  periodId: string;
  fundId?: string | null;
  costCenterId?: string | null;
  openingDebit: number | string;
  openingCredit: number | string;
  periodDebit: number | string;
  periodCredit: number | string;
  closingDebit: number | string;
  closingCredit: number | string;
  updatedAt: Date | string;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalanceReport {
  accountingEntityId: string;
  asOfDate: string;
  periodName?: string;
  currency: string;
  rows: TrialBalanceRow[];
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
}

export interface BalanceSheetCategory {
  categoryName: string;
  accounts: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    amount: number;
  }>;
  subtotal: number;
}

export interface BalanceSheetReport {
  accountingEntityId: string;
  asOfDate: string;
  currency: string;
  assets: BalanceSheetCategory[];
  totalAssets: number;
  liabilities: BalanceSheetCategory[];
  totalLiabilities: number;
  fundsAndEquity: BalanceSheetCategory[];
  totalFundsAndEquity: number;
  currentPeriodSurplus: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface IncomeExpenditureCategory {
  categoryName: string;
  accounts: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    amount: number;
  }>;
  subtotal: number;
}

export interface IncomeExpenditureReport {
  accountingEntityId: string;
  startDate: string;
  endDate: string;
  currency: string;
  income: IncomeExpenditureCategory[];
  totalIncome: number;
  expenses: IncomeExpenditureCategory[];
  totalExpenses: number;
  netSurplusOrDeficit: number;
}

export interface AccountLedgerItem {
  id: string;
  postingDate: string;
  journalId: string;
  journalNumber: string;
  reference?: string | null;
  description: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  fundName?: string | null;
  costCenterName?: string | null;
  sourceModule?: string | null;
}

export interface AccountLedgerReport {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  entries: AccountLedgerItem[];
}

export interface FinancialDashboardKpis {
  cashAndBankBalance: number;
  currentPeriodIncome: number;
  currentPeriodExpense: number;
  currentPeriodSurplus: number;
  activeFundsCount: number;
  unpostedJournalsCount: number;
  pendingApprovalsCount: number;
  currentPeriodName: string;
  currentPeriodStatus: PeriodStatus;
}
