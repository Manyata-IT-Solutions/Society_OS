import type {
  BillableAccount,
  BillingPlan,
  ChargeDefinition,
  ChargeRule,
  BillingPeriod,
  BillingRun,
  Invoice,
  Payment,
  Receipt,
  ResidentLedgerEntry,
} from '@community-os/types';

export interface BillableAccountResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  accountNumber: string;
  accountType: string;
  displayName: string;
  unitId?: string | null;
  unitNumber?: string | null;
  householdId?: string | null;
  residentId?: string | null;
  status: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toBillableAccountResponseDto(
  acc: BillableAccount | Record<string, unknown>,
): BillableAccountResponseDto {
  const a = acc as Record<string, unknown>;
  const u = a.unit as Record<string, unknown> | undefined;
  return {
    id: String(a.id),
    organizationId: String(a.organizationId),
    communityId: String(a.communityId),
    accountNumber: String(a.accountNumber),
    accountType: String(a.accountType),
    displayName: String(a.displayName),
    unitId: (a.unitId as string) ?? null,
    unitNumber: u ? String(u.unitNumber) : null,
    householdId: (a.householdId as string) ?? null,
    residentId: (a.residentId as string) ?? null,
    status: String(a.status),
    effectiveFrom:
      a.effectiveFrom instanceof Date ? a.effectiveFrom.toISOString() : String(a.effectiveFrom),
    effectiveTo: a.effectiveTo
      ? a.effectiveTo instanceof Date
        ? a.effectiveTo.toISOString()
        : String(a.effectiveTo)
      : null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
    version: Number(a.version),
  };
}

export interface BillingPlanResponseDto {
  id: string;
  communityId: string;
  code: string;
  name: string;
  description?: string | null;
  recurrenceType: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  chargeRules?: ChargeRuleResponseDto[];
}

export function toBillingPlanResponseDto(
  plan: BillingPlan | Record<string, unknown>,
): BillingPlanResponseDto {
  const p = plan as Record<string, unknown>;
  const rawRules = Array.isArray(p.chargeRules)
    ? (p.chargeRules as Array<Record<string, unknown>>)
    : undefined;
  return {
    id: String(p.id),
    communityId: String(p.communityId),
    code: String(p.code),
    name: String(p.name),
    description: (p.description as string) ?? null,
    recurrenceType: String(p.recurrenceType),
    effectiveFrom:
      p.effectiveFrom instanceof Date ? p.effectiveFrom.toISOString() : String(p.effectiveFrom),
    effectiveTo: p.effectiveTo
      ? p.effectiveTo instanceof Date
        ? p.effectiveTo.toISOString()
        : String(p.effectiveTo)
      : null,
    isActive: Boolean(p.isActive),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
    version: Number(p.version),
    chargeRules: rawRules?.map(toChargeRuleResponseDto),
  };
}

export interface ChargeDefinitionResponseDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
  category: string;
  chargeNature: string;
  recurrenceType: string;
  defaultCalculation: string;
  defaultUOM?: string | null;
  taxable: boolean;
  accountingMappingKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toChargeDefinitionResponseDto(
  cd: ChargeDefinition | Record<string, unknown>,
): ChargeDefinitionResponseDto {
  const c = cd as Record<string, unknown>;
  return {
    id: String(c.id),
    organizationId: String(c.organizationId),
    code: String(c.code),
    name: String(c.name),
    description: (c.description as string) ?? null,
    category: String(c.category),
    chargeNature: String(c.chargeNature),
    recurrenceType: String(c.recurrenceType),
    defaultCalculation: String(c.defaultCalculation),
    defaultUOM: (c.defaultUOM as string) ?? null,
    taxable: Boolean(c.taxable),
    accountingMappingKey: String(c.accountingMappingKey),
    isActive: Boolean(c.isActive),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
    version: Number(c.version),
  };
}

export interface ChargeRuleResponseDto {
  id: string;
  billingPlanId: string;
  chargeDefinitionId: string;
  chargeDefinitionCode?: string;
  chargeDefinitionName?: string;
  calculationMethod: string;
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
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toChargeRuleResponseDto(
  cr: ChargeRule | Record<string, unknown>,
): ChargeRuleResponseDto {
  const r = cr as Record<string, unknown>;
  const cd = r.chargeDefinition as Record<string, unknown> | undefined;
  return {
    id: String(r.id),
    billingPlanId: String(r.billingPlanId),
    chargeDefinitionId: String(r.chargeDefinitionId),
    chargeDefinitionCode: cd ? String(cd.code) : undefined,
    chargeDefinitionName: cd ? String(cd.name) : undefined,
    calculationMethod: String(r.calculationMethod),
    amount: Number(r.amount),
    rate: Number(r.rate),
    minimumAmount: r.minimumAmount ? Number(r.minimumAmount) : null,
    maximumAmount: r.maximumAmount ? Number(r.maximumAmount) : null,
    roundingPolicy: String(r.roundingPolicy),
    dueDays: Number(r.dueDays),
    graceDays: Number(r.graceDays),
    fundId: (r.fundId as string) ?? null,
    costCenterId: (r.costCenterId as string) ?? null,
    accountingMappingKey: (r.accountingMappingKey as string) ?? null,
    priority: Number(r.priority),
    effectiveFrom:
      r.effectiveFrom instanceof Date ? r.effectiveFrom.toISOString() : String(r.effectiveFrom),
    effectiveTo: r.effectiveTo
      ? r.effectiveTo instanceof Date
        ? r.effectiveTo.toISOString()
        : String(r.effectiveTo)
      : null,
    isActive: Boolean(r.isActive),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
    version: Number(r.version),
  };
}

export interface BillingPeriodResponseDto {
  id: string;
  communityId: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  invoiceDate: string;
  dueDate: string;
  graceDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toBillingPeriodResponseDto(
  bp: BillingPeriod | Record<string, unknown>,
): BillingPeriodResponseDto {
  const p = bp as Record<string, unknown>;
  return {
    id: String(p.id),
    communityId: String(p.communityId),
    name: String(p.name),
    code: String(p.code),
    startDate:
      p.startDate instanceof Date
        ? p.startDate.toISOString().split('T')[0] || ''
        : String(p.startDate).split('T')[0] || '',
    endDate:
      p.endDate instanceof Date
        ? p.endDate.toISOString().split('T')[0] || ''
        : String(p.endDate).split('T')[0] || '',
    invoiceDate:
      p.invoiceDate instanceof Date
        ? p.invoiceDate.toISOString().split('T')[0] || ''
        : String(p.invoiceDate).split('T')[0] || '',
    dueDate:
      p.dueDate instanceof Date
        ? p.dueDate.toISOString().split('T')[0] || ''
        : String(p.dueDate).split('T')[0] || '',
    graceDate:
      p.graceDate instanceof Date
        ? p.graceDate.toISOString().split('T')[0] || ''
        : String(p.graceDate).split('T')[0] || '',
    status: String(p.status),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
    version: Number(p.version),
  };
}

export interface BillingRunResponseDto {
  id: string;
  communityId: string;
  billingPeriodId: string;
  billingPlanId: string;
  runNumber: string;
  runPurpose: string;
  status: string;
  totalAccounts: number;
  successCount: number;
  failureCount: number;
  totalBilled: number;
  initiatedById?: string | null;
  approvedById?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  idempotencyKey: string;
  exceptionSummary?: Array<{ accountId?: string; unitNumber?: string; reason: string }>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toBillingRunResponseDto(
  br: BillingRun | Record<string, unknown>,
): BillingRunResponseDto {
  const r = br as Record<string, unknown>;
  return {
    id: String(r.id),
    communityId: String(r.communityId),
    billingPeriodId: String(r.billingPeriodId),
    billingPlanId: String(r.billingPlanId),
    runNumber: String(r.runNumber),
    runPurpose: String(r.runPurpose),
    status: String(r.status),
    totalAccounts: Number(r.totalAccounts),
    successCount: Number(r.successCount),
    failureCount: Number(r.failureCount),
    totalBilled: Number(r.totalBilled),
    initiatedById: (r.initiatedById as string) ?? null,
    approvedById: (r.approvedById as string) ?? null,
    startedAt: r.startedAt
      ? r.startedAt instanceof Date
        ? r.startedAt.toISOString()
        : String(r.startedAt)
      : null,
    completedAt: r.completedAt
      ? r.completedAt instanceof Date
        ? r.completedAt.toISOString()
        : String(r.completedAt)
      : null,
    idempotencyKey: String(r.idempotencyKey),
    exceptionSummary: r.exceptionSummary as any,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
    version: Number(r.version),
  };
}

export interface InvoiceLineResponseDto {
  id: string;
  lineNumber: number;
  chargeDefinitionId: string;
  chargeCode?: string;
  chargeName?: string;
  descriptionSnapshot: string;
  periodStart: string;
  periodEnd: string;
  quantity: number;
  rate: number;
  amount: number;
  discountAmount: number;
  waiverAmount: number;
  netAmount: number;
  fundId?: string | null;
  costCenterId?: string | null;
  accountingMappingKey: string;
}

export interface InvoiceResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  invoiceNumber: string;
  billableAccountId: string;
  billableAccountNumber?: string;
  billableAccountName?: string;
  unitNumber?: string;
  billingPeriodId: string;
  billingPeriodName?: string;
  invoiceDate: string;
  dueDate: string;
  graceDate?: string | null;
  status: string;
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
  issuedAt?: string | null;
  cancelledAt?: string | null;
  documentId?: string | null;
  financeJournalId?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  lines?: InvoiceLineResponseDto[];
}

export function toInvoiceResponseDto(inv: Invoice | Record<string, unknown>): InvoiceResponseDto {
  const i = inv as Record<string, unknown>;
  const acc = i.billableAccount as Record<string, unknown> | undefined;
  const u = acc?.unit as Record<string, unknown> | undefined;
  const p = i.billingPeriod as Record<string, unknown> | undefined;
  const rawLines = Array.isArray(i.lines) ? (i.lines as Array<Record<string, unknown>>) : undefined;

  return {
    id: String(i.id),
    organizationId: String(i.organizationId),
    communityId: String(i.communityId),
    invoiceNumber: String(i.invoiceNumber),
    billableAccountId: String(i.billableAccountId),
    billableAccountNumber: acc ? String(acc.accountNumber) : undefined,
    billableAccountName: acc ? String(acc.displayName) : undefined,
    unitNumber: u ? String(u.unitNumber) : undefined,
    billingPeriodId: String(i.billingPeriodId),
    billingPeriodName: p ? String(p.name) : undefined,
    invoiceDate:
      i.invoiceDate instanceof Date
        ? i.invoiceDate.toISOString().split('T')[0] || ''
        : String(i.invoiceDate).split('T')[0] || '',
    dueDate:
      i.dueDate instanceof Date
        ? i.dueDate.toISOString().split('T')[0] || ''
        : String(i.dueDate).split('T')[0] || '',
    graceDate: i.graceDate
      ? i.graceDate instanceof Date
        ? i.graceDate.toISOString().split('T')[0] || ''
        : String(i.graceDate).split('T')[0] || ''
      : null,
    status: String(i.status),
    currency: String(i.currency),
    subtotal: Number(i.subtotal),
    discountTotal: Number(i.discountTotal),
    waiverTotal: Number(i.waiverTotal),
    penaltyTotal: Number(i.penaltyTotal),
    interestTotal: Number(i.interestTotal),
    grandTotal: Number(i.grandTotal),
    allocatedAmount: Number(i.allocatedAmount),
    outstandingAmount: Number(i.outstandingAmount),
    revision: Number(i.revision),
    issuedAt: i.issuedAt
      ? i.issuedAt instanceof Date
        ? i.issuedAt.toISOString()
        : String(i.issuedAt)
      : null,
    cancelledAt: i.cancelledAt
      ? i.cancelledAt instanceof Date
        ? i.cancelledAt.toISOString()
        : String(i.cancelledAt)
      : null,
    documentId: (i.documentId as string) ?? null,
    financeJournalId: (i.financeJournalId as string) ?? null,
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt),
    updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : String(i.updatedAt),
    version: Number(i.version),
    lines: rawLines?.map((l: Record<string, unknown>) => {
      const cd = l.chargeDefinition as Record<string, unknown> | undefined;
      return {
        id: String(l.id),
        lineNumber: Number(l.lineNumber),
        chargeDefinitionId: String(l.chargeDefinitionId),
        chargeCode: cd ? String(cd.code) : undefined,
        chargeName: cd ? String(cd.name) : undefined,
        descriptionSnapshot: String(l.descriptionSnapshot),
        periodStart:
          l.periodStart instanceof Date
            ? l.periodStart.toISOString().split('T')[0] || ''
            : String(l.periodStart).split('T')[0] || '',
        periodEnd:
          l.periodEnd instanceof Date
            ? l.periodEnd.toISOString().split('T')[0] || ''
            : String(l.periodEnd).split('T')[0] || '',
        quantity: Number(l.quantity),
        rate: Number(l.rate),
        amount: Number(l.amount),
        discountAmount: Number(l.discountAmount),
        waiverAmount: Number(l.waiverAmount),
        netAmount: Number(l.netAmount),
        fundId: (l.fundId as string) ?? null,
        costCenterId: (l.costCenterId as string) ?? null,
        accountingMappingKey: String(l.accountingMappingKey),
      };
    }),
  };
}

export interface PaymentResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  paymentNumber: string;
  billableAccountId: string;
  billableAccountNumber?: string;
  billableAccountName?: string;
  paymentDate: string;
  receivedAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  chequeNumber?: string | null;
  chequeDate?: string | null;
  chequeBank?: string | null;
  chequeStatus?: string | null;
  status: string;
  reversedAt?: string | null;
  reversalReason?: string | null;
  financeJournalId?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toPaymentResponseDto(pay: Payment | Record<string, unknown>): PaymentResponseDto {
  const p = pay as Record<string, unknown>;
  const acc = p.billableAccount as Record<string, unknown> | undefined;
  return {
    id: String(p.id),
    organizationId: String(p.organizationId),
    communityId: String(p.communityId),
    paymentNumber: String(p.paymentNumber),
    billableAccountId: String(p.billableAccountId),
    billableAccountNumber: acc ? String(acc.accountNumber) : undefined,
    billableAccountName: acc ? String(acc.displayName) : undefined,
    paymentDate:
      p.paymentDate instanceof Date
        ? p.paymentDate.toISOString().split('T')[0] || ''
        : String(p.paymentDate).split('T')[0] || '',
    receivedAmount: Number(p.receivedAmount),
    allocatedAmount: Number(p.allocatedAmount),
    unallocatedAmount: Number(p.unallocatedAmount),
    currency: String(p.currency),
    paymentMethod: String(p.paymentMethod),
    referenceNumber: (p.referenceNumber as string) ?? null,
    chequeNumber: (p.chequeNumber as string) ?? null,
    chequeDate: p.chequeDate
      ? p.chequeDate instanceof Date
        ? p.chequeDate.toISOString().split('T')[0] || ''
        : String(p.chequeDate).split('T')[0] || ''
      : null,
    chequeBank: (p.chequeBank as string) ?? null,
    chequeStatus: (p.chequeStatus as string) ?? null,
    status: String(p.status),
    reversedAt: p.reversedAt
      ? p.reversedAt instanceof Date
        ? p.reversedAt.toISOString()
        : String(p.reversedAt)
      : null,
    reversalReason: (p.reversalReason as string) ?? null,
    financeJournalId: (p.financeJournalId as string) ?? null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
    version: Number(p.version),
  };
}

export interface ReceiptResponseDto {
  id: string;
  communityId: string;
  receiptNumber: string;
  paymentId: string;
  paymentNumber?: string;
  billableAccountId: string;
  billableAccountName?: string;
  receiptDate: string;
  amount: number;
  status: string;
  documentId?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toReceiptResponseDto(rc: Receipt | Record<string, unknown>): ReceiptResponseDto {
  const r = rc as Record<string, unknown>;
  const p = r.payment as Record<string, unknown> | undefined;
  const acc = r.billableAccount as Record<string, unknown> | undefined;
  return {
    id: String(r.id),
    communityId: String(r.communityId),
    receiptNumber: String(r.receiptNumber),
    paymentId: String(r.paymentId),
    paymentNumber: p ? String(p.paymentNumber) : undefined,
    billableAccountId: String(r.billableAccountId),
    billableAccountName: acc ? String(acc.displayName) : undefined,
    receiptDate:
      r.receiptDate instanceof Date
        ? r.receiptDate.toISOString().split('T')[0] || ''
        : String(r.receiptDate).split('T')[0] || '',
    amount: Number(r.amount),
    status: String(r.status),
    documentId: (r.documentId as string) ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
    version: Number(r.version),
  };
}

export interface ResidentLedgerEntryResponseDto {
  id: string;
  residentAccountId: string;
  entryDate: string;
  entryType: string;
  referenceType: string;
  referenceId: string;
  debit: number;
  credit: number;
  runningBalance: number;
  description: string;
  sourceModule: string;
  createdAt: string;
}

export function toResidentLedgerEntryResponseDto(
  le: ResidentLedgerEntry | Record<string, unknown>,
): ResidentLedgerEntryResponseDto {
  const l = le as Record<string, unknown>;
  return {
    id: String(l.id),
    residentAccountId: String(l.residentAccountId),
    entryDate:
      l.entryDate instanceof Date
        ? l.entryDate.toISOString().split('T')[0] || ''
        : String(l.entryDate).split('T')[0] || '',
    entryType: String(l.entryType),
    referenceType: String(l.referenceType),
    referenceId: String(l.referenceId),
    debit: Number(l.debit),
    credit: Number(l.credit),
    runningBalance: Number(l.runningBalance),
    description: String(l.description),
    sourceModule: String(l.sourceModule),
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
  };
}
