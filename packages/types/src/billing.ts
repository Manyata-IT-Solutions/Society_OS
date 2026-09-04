export type BillableAccountType = 'UNIT' | 'HOUSEHOLD' | 'OWNER' | 'TENANT' | 'COMPANY' | 'OTHER';

export type BillableAccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';

export type ChargeCategory =
  | 'MAINTENANCE'
  | 'UTILITY'
  | 'FUND'
  | 'AMENITY'
  | 'PARKING'
  | 'SPECIAL'
  | 'PENALTY'
  | 'INTEREST'
  | 'ADMINISTRATIVE'
  | 'OTHER';

export type ChargeNature =
  | 'FIXED'
  | 'AREA_BASED'
  | 'UNIT_BASED'
  | 'OCCUPANCY_BASED'
  | 'METER_BASED'
  | 'FORMULA_BASED'
  | 'MANUAL';

export type BillingRecurrence =
  'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | 'ONE_TIME' | 'CUSTOM';

export type CalculationMethod =
  | 'FIXED_AMOUNT'
  | 'PER_SQFT'
  | 'PER_SQM'
  | 'PER_UNIT'
  | 'PER_PARKING'
  | 'MANUAL'
  | 'SAFE_RULE_EXPRESSION';

export type BillingPeriodStatus = 'OPEN' | 'GENERATED' | 'FINALIZED' | 'CLOSED' | 'ARCHIVED';

export type BillingRunStatus =
  | 'DRAFT'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'WAIVED'
  | 'CANCELLED'
  | 'WRITTEN_OFF';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'CHEQUE'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CARD'
  | 'PAYMENT_GATEWAY'
  | 'NEFT'
  | 'RTGS'
  | 'IMPS'
  | 'OTHER';

export type ChequeStatus = 'RECEIVED' | 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | 'CANCELLED';

export type AllocationRule =
  | 'OLDEST_DUE_FIRST'
  | 'OLDEST_INVOICE_FIRST'
  | 'CURRENT_INVOICE_FIRST'
  | 'MANUAL'
  | 'SPECIFIC_INVOICE'
  | 'PROPORTIONAL';

export type ResidentLedgerEntryType =
  | 'OPENING'
  | 'INVOICE'
  | 'DEBIT_NOTE'
  | 'CREDIT_NOTE'
  | 'RECEIPT'
  | 'PAYMENT_REVERSAL'
  | 'WAIVER'
  | 'PENALTY'
  | 'INTEREST'
  | 'WRITE_OFF'
  | 'ADJUSTMENT';

export type WaiverStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type CollectionStatus =
  'CURRENT' | 'DUE' | 'OVERDUE' | 'FOLLOW_UP' | 'PROMISE_TO_PAY' | 'LEGAL_REVIEW' | 'SETTLED';

export interface BillableAccount {
  id: string;
  organizationId: string;
  communityId: string;
  accountNumber: string;
  accountType: BillableAccountType;
  displayName: string;
  unitId?: string | null;
  householdId?: string | null;
  residentId?: string | null;
  status: BillableAccountStatus;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface BillingPlan {
  id: string;
  communityId: string;
  code: string;
  name: string;
  description?: string | null;
  recurrenceType: BillingRecurrence;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface ChargeDefinition {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
  category: ChargeCategory;
  chargeNature: ChargeNature;
  recurrenceType: BillingRecurrence;
  defaultCalculation: CalculationMethod;
  defaultUOM?: string | null;
  taxable: boolean;
  accountingMappingKey: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface ChargeRule {
  id: string;
  billingPlanId: string;
  chargeDefinitionId: string;
  calculationMethod: CalculationMethod;
  amount: number;
  rate: number;
  minimumAmount?: number | null;
  maximumAmount?: number | null;
  roundingPolicy: string;
  dueDays: number;
  graceDays: number;
  fundId?: string | null;
  costCenterId?: string | null;
  accountingMappingKey?: string | null;
  priority: number;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface ChargeAssignment {
  id: string;
  communityId: string;
  chargeDefinitionId: string;
  buildingId?: string | null;
  unitId?: string | null;
  billableAccountId?: string | null;
  calculationMethod: CalculationMethod;
  amount: number;
  rate: number;
  fundId?: string | null;
  costCenterId?: string | null;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface BillingPeriod {
  id: string;
  communityId: string;
  name: string;
  code: string;
  startDate: Date | string;
  endDate: Date | string;
  invoiceDate: Date | string;
  dueDate: Date | string;
  graceDate: Date | string;
  status: BillingPeriodStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface BillingRun {
  id: string;
  communityId: string;
  billingPeriodId: string;
  billingPlanId: string;
  runNumber: string;
  runPurpose: string;
  status: BillingRunStatus;
  totalAccounts: number;
  successCount: number;
  failureCount: number;
  totalBilled: number;
  initiatedById?: string | null;
  approvedById?: string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  idempotencyKey: string;
  exceptionSummary?: Array<{ accountId?: string; unitNumber?: string; reason: string }>;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  lineNumber: number;
  chargeDefinitionId: string;
  descriptionSnapshot: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  quantity: number;
  rate: number;
  amount: number;
  discountAmount: number;
  waiverAmount: number;
  netAmount: number;
  fundId?: string | null;
  costCenterId?: string | null;
  accountingMappingKey: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  communityId: string;
  invoiceNumber: string;
  billableAccountId: string;
  billingPeriodId: string;
  billingRunId?: string | null;
  billingSnapshotId?: string | null;
  invoiceDate: Date | string;
  dueDate: Date | string;
  graceDate?: Date | string | null;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discountTotal: number;
  waiverTotal: number;
  penaltyTotal: number;
  interestTotal: number;
  grandTotal: number;
  allocatedAmount: number;
  outstandingAmount: number;
  revision: number;
  issuedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  documentId?: string | null;
  createdById?: string | null;
  financeJournalId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
  lines?: InvoiceLine[];
}

export interface Payment {
  id: string;
  organizationId: string;
  communityId: string;
  paymentNumber: string;
  billableAccountId: string;
  paymentDate: Date | string;
  receivedAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  chequeNumber?: string | null;
  chequeDate?: Date | string | null;
  chequeBank?: string | null;
  chequeStatus?: ChequeStatus | null;
  status: PaymentStatus;
  receivedById?: string | null;
  reversedAt?: Date | string | null;
  reversalReason?: string | null;
  idempotencyKey?: string | null;
  financeJournalId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface Receipt {
  id: string;
  communityId: string;
  receiptNumber: string;
  paymentId: string;
  billableAccountId: string;
  receiptDate: Date | string;
  amount: number;
  status: PaymentStatus;
  documentId?: string | null;
  createdById?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  allocationAmount: number;
  allocationDate: Date | string;
  allocationRule: AllocationRule;
  sequence: number;
  isReversed: boolean;
  reversedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface ResidentAccount {
  id: string;
  billableAccountId: string;
  accountNumber: string;
  openingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
  totalWaived: number;
  advanceCredit: number;
  currentBalance: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  version: number;
}

export interface ResidentLedgerEntry {
  id: string;
  residentAccountId: string;
  entryDate: Date | string;
  entryType: ResidentLedgerEntryType;
  referenceType: string;
  referenceId: string;
  debit: number;
  credit: number;
  runningBalance: number;
  description: string;
  sourceModule: string;
  createdAt: Date | string;
}

export interface ResidentOutstanding {
  id: string;
  residentAccountId: string;
  currentDue: number;
  overdue: number;
  advanceCredit: number;
  totalOutstanding: number;
  bucket0To30: number;
  bucket31To60: number;
  bucket61To90: number;
  bucket91Plus: number;
  lastInvoiceDate?: Date | string | null;
  lastPaymentDate?: Date | string | null;
  collectionStatus: CollectionStatus;
  updatedAt: Date | string;
}

export interface AgingReportRow {
  billableAccountId: string;
  accountNumber: string;
  displayName: string;
  unitNumber?: string;
  buildingName?: string;
  currentDue: number;
  bucket0To30: number;
  bucket31To60: number;
  bucket61To90: number;
  bucket91Plus: number;
  totalOutstanding: number;
  advanceCredit: number;
  collectionStatus: CollectionStatus;
}

export interface BillingDashboardKpis {
  totalBilled: number;
  collectedThisPeriod: number;
  collectionPercentage: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalAdvanceCredit: number;
  invoicesCount: {
    draft: number;
    issued: number;
    paid: number;
    partiallyPaid: number;
    overdue: number;
  };
  agingSummary: {
    current: number;
    bucket0To30: number;
    bucket31To60: number;
    bucket61To90: number;
    bucket91Plus: number;
  };
}
