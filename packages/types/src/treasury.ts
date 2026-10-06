export type BankAccountStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';

export type BankAccountType = 'CURRENT' | 'SAVINGS' | 'ESCROW' | 'SWEEP' | 'PETTY_CASH';

export type BankStatementStatus = 'UPLOADED' | 'PARSED' | 'RECONCILED' | 'VOIDED';

export type BankTransactionDirection = 'DEBIT' | 'CREDIT';

export type BankMatchStatus =
  'UNMATCHED' | 'AUTO_MATCHED' | 'MANUALLY_MATCHED' | 'SPLIT_MATCHED' | 'EXCLUDED';

export type BankMatchConfidence = 'EXACT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type BankReconciliationStatus =
  'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'REOPENED';

export interface BankAccountSummary {
  id: string;
  accountingEntityId: string;
  name: string;
  bankName: string;
  accountType: BankAccountType;
  currency: string;
  maskedAccountNumber: string;
  routingCode?: string | null;
  glAccountId: string;
  status: BankAccountStatus;
  isDefault: boolean;
  bookBalance: number;
  createdAt: string;
}

export interface BankStatementSummary {
  id: string;
  bankAccountId: string;
  bankAccountName?: string;
  statementReference: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  currency: string;
  importSource: string;
  status: BankStatementStatus;
  transactionsCount: number;
  importedAt: string;
}

export interface BankTransactionSummary {
  id: string;
  bankStatementId: string;
  bankAccountId: string;
  transactionDate: string;
  valueDate?: string | null;
  description: string;
  bankReference?: string | null;
  amount: number;
  direction: BankTransactionDirection;
  runningBalance?: number | null;
  status: BankMatchStatus;
  matchId?: string | null;
  fingerprint: string;
}

export interface BankReconciliationSessionSummary {
  id: string;
  bankAccountId: string;
  bankAccountName?: string;
  statementId?: string | null;
  sessionNumber: string;
  periodStart: string;
  periodEnd: string;
  bookOpeningBalance: number;
  statementOpeningBalance: number;
  bookClosingBalance: number;
  statementClosingBalance: number;
  unmatchedDebitsTotal: number;
  unmatchedCreditsTotal: number;
  difference: number;
  status: BankReconciliationStatus;
  completedAt?: string | null;
}
