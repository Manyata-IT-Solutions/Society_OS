import type {
  AccountingEntity,
  FiscalYear,
  LedgerAccount,
  CostCenter,
  Fund,
  JournalEntry,
} from '@community-os/types';

export interface AccountingEntityResponseDto {
  id: string;
  organizationId: string;
  communityId?: string | null;
  code: string;
  name: string;
  legalName: string;
  countryCode: string;
  baseCurrency: string;
  timezone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toAccountingEntityResponseDto(
  entity: AccountingEntity | Record<string, unknown>,
): AccountingEntityResponseDto {
  const e = entity as Record<string, unknown>;
  return {
    id: String(e.id),
    organizationId: String(e.organizationId),
    communityId: (e.communityId as string) ?? null,
    code: String(e.code),
    name: String(e.name),
    legalName: String(e.legalName),
    countryCode: String(e.countryCode),
    baseCurrency: String(e.baseCurrency),
    timezone: String(e.timezone),
    status: String(e.status),
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : String(e.updatedAt),
    version: Number(e.version),
  };
}

export interface LedgerAccountResponseDto {
  id: string;
  accountingEntityId: string;
  accountCode: string;
  name: string;
  description?: string | null;
  accountType: string;
  accountSubType: string;
  parentAccountId?: string | null;
  postingAllowed: boolean;
  normalBalance: string;
  status: string;
  systemAccountKey?: string | null;
  isControlAccount: boolean;
  allowManualPosting: boolean;
  reconciliationRequired: boolean;
  currencyRestriction?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  children?: LedgerAccountResponseDto[];
}

export function toLedgerAccountResponseDto(
  acc: LedgerAccount | Record<string, unknown>,
): LedgerAccountResponseDto {
  const a = acc as Record<string, unknown>;
  const children = Array.isArray(a.children)
    ? (a.children as Array<Record<string, unknown>>).map(toLedgerAccountResponseDto)
    : undefined;

  return {
    id: String(a.id),
    accountingEntityId: String(a.accountingEntityId),
    accountCode: String(a.accountCode),
    name: String(a.name),
    description: (a.description as string) ?? null,
    accountType: String(a.accountType),
    accountSubType: String(a.accountSubType),
    parentAccountId: (a.parentAccountId as string) ?? null,
    postingAllowed: Boolean(a.postingAllowed),
    normalBalance: String(a.normalBalance),
    status: String(a.status),
    systemAccountKey: (a.systemAccountKey as string) ?? null,
    isControlAccount: Boolean(a.isControlAccount),
    allowManualPosting: Boolean(a.allowManualPosting),
    reconciliationRequired: Boolean(a.reconciliationRequired),
    currencyRestriction: (a.currencyRestriction as string) ?? null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
    version: Number(a.version),
    children,
  };
}

export interface FiscalYearResponseDto {
  id: string;
  accountingEntityId: string;
  fiscalCalendarId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  closedAt?: string | null;
  closedById?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  periods?: Array<{
    id: string;
    periodNumber: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
}

export function toFiscalYearResponseDto(
  fy: FiscalYear | Record<string, unknown>,
): FiscalYearResponseDto {
  const f = fy as Record<string, unknown>;
  const rawPeriods = Array.isArray(f.periods)
    ? (f.periods as Array<Record<string, unknown>>)
    : undefined;

  return {
    id: String(f.id),
    accountingEntityId: String(f.accountingEntityId),
    fiscalCalendarId: String(f.fiscalCalendarId),
    name: String(f.name),
    startDate:
      f.startDate instanceof Date
        ? (f.startDate.toISOString().split('T')[0] ?? '')
        : (String(f.startDate).split('T')[0] ?? ''),
    endDate:
      f.endDate instanceof Date
        ? (f.endDate.toISOString().split('T')[0] ?? '')
        : (String(f.endDate).split('T')[0] ?? ''),
    status: String(f.status),
    closedAt: f.closedAt
      ? f.closedAt instanceof Date
        ? f.closedAt.toISOString()
        : String(f.closedAt)
      : null,
    closedById: (f.closedById as string) ?? null,
    createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
    updatedAt: f.updatedAt instanceof Date ? f.updatedAt.toISOString() : String(f.updatedAt),
    version: Number(f.version),
    periods: rawPeriods?.map((p) => ({
      id: String(p.id),
      periodNumber: Number(p.periodNumber),
      name: String(p.name),
      startDate:
        p.startDate instanceof Date
          ? (p.startDate.toISOString().split('T')[0] ?? '')
          : (String(p.startDate).split('T')[0] ?? ''),
      endDate:
        p.endDate instanceof Date
          ? (p.endDate.toISOString().split('T')[0] ?? '')
          : (String(p.endDate).split('T')[0] ?? ''),
      status: String(p.status),
    })),
  };
}

export interface JournalLineResponseDto {
  id: string;
  lineNumber: number;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  baseAmount: number;
  costCenterId?: string | null;
  costCenterName?: string | null;
  fundId?: string | null;
  fundName?: string | null;
  partyType?: string | null;
  partyId?: string | null;
  dimensions?: Record<string, unknown>;
  sourceLineReference?: string | null;
}

export interface JournalEntryResponseDto {
  id: string;
  accountingEntityId: string;
  journalNumber: string;
  journalType: string;
  journalDate: string;
  fiscalYearId: string;
  accountingPeriodId: string;
  status: string;
  description: string;
  reference?: string | null;
  sourceModule?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  postingPurpose?: string | null;
  currency: string;
  exchangeRate?: number | null;
  totalDebit: number;
  totalCredit: number;
  postedAt?: string | null;
  postedById?: string | null;
  reversedAt?: string | null;
  reversalJournalId?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  lines?: JournalLineResponseDto[];
}

export function toJournalEntryResponseDto(
  j: JournalEntry | Record<string, unknown>,
): JournalEntryResponseDto {
  const row = j as Record<string, unknown>;
  const rawLines = Array.isArray(row.lines)
    ? (row.lines as Array<Record<string, unknown>>)
    : undefined;

  return {
    id: String(row.id),
    accountingEntityId: String(row.accountingEntityId),
    journalNumber: String(row.journalNumber),
    journalType: String(row.journalType),
    journalDate:
      row.journalDate instanceof Date
        ? (row.journalDate.toISOString().split('T')[0] ?? '')
        : (String(row.journalDate).split('T')[0] ?? ''),
    fiscalYearId: String(row.fiscalYearId),
    accountingPeriodId: String(row.accountingPeriodId),
    status: String(row.status),
    description: String(row.description),
    reference: (row.reference as string) ?? null,
    sourceModule: (row.sourceModule as string) ?? null,
    sourceType: (row.sourceType as string) ?? null,
    sourceId: (row.sourceId as string) ?? null,
    postingPurpose: (row.postingPurpose as string) ?? null,
    currency: String(row.currency),
    exchangeRate: row.exchangeRate ? Number(row.exchangeRate) : null,
    totalDebit: Number(row.totalDebit),
    totalCredit: Number(row.totalCredit),
    postedAt: row.postedAt
      ? row.postedAt instanceof Date
        ? row.postedAt.toISOString()
        : String(row.postedAt)
      : null,
    postedById: (row.postedById as string) ?? null,
    reversedAt: row.reversedAt
      ? row.reversedAt instanceof Date
        ? row.reversedAt.toISOString()
        : String(row.reversedAt)
      : null,
    reversalJournalId: (row.reversalJournalId as string) ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    version: Number(row.version),
    lines: rawLines?.map((l: Record<string, unknown>) => {
      const acc = l.account as Record<string, unknown> | undefined;
      const cc = l.costCenter as Record<string, unknown> | undefined;
      const f = l.fund as Record<string, unknown> | undefined;
      return {
        id: String(l.id),
        lineNumber: Number(l.lineNumber),
        accountId: String(l.accountId),
        accountCode: acc ? String(acc.accountCode) : undefined,
        accountName: acc ? String(acc.name) : undefined,
        description: String(l.description),
        debitAmount: Number(l.debitAmount),
        creditAmount: Number(l.creditAmount),
        baseAmount: Number(l.baseAmount),
        costCenterId: (l.costCenterId as string) ?? null,
        costCenterName: cc ? String(cc.name) : null,
        fundId: (l.fundId as string) ?? null,
        fundName: f ? String(f.name) : null,
        partyType: (l.partyType as string) ?? null,
        partyId: (l.partyId as string) ?? null,
        dimensions: (l.dimensions as Record<string, unknown>) ?? {},
        sourceLineReference: (l.sourceLineReference as string) ?? null,
      };
    }),
  };
}

export interface CostCenterResponseDto {
  id: string;
  accountingEntityId: string;
  code: string;
  name: string;
  description?: string | null;
  parentCostCenterId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toCostCenterResponseDto(
  cc: CostCenter | Record<string, unknown>,
): CostCenterResponseDto {
  const c = cc as Record<string, unknown>;
  return {
    id: String(c.id),
    accountingEntityId: String(c.accountingEntityId),
    code: String(c.code),
    name: String(c.name),
    description: (c.description as string) ?? null,
    parentCostCenterId: (c.parentCostCenterId as string) ?? null,
    status: String(c.status),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt),
    version: Number(c.version),
  };
}

export interface FundResponseDto {
  id: string;
  accountingEntityId: string;
  code: string;
  name: string;
  description?: string | null;
  fundType: string;
  restrictionType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toFundResponseDto(f: Fund | Record<string, unknown>): FundResponseDto {
  const fund = f as Record<string, unknown>;
  return {
    id: String(fund.id),
    accountingEntityId: String(fund.accountingEntityId),
    code: String(fund.code),
    name: String(fund.name),
    description: (fund.description as string) ?? null,
    fundType: String(fund.fundType),
    restrictionType: String(fund.restrictionType),
    status: String(fund.status),
    createdAt:
      fund.createdAt instanceof Date ? fund.createdAt.toISOString() : String(fund.createdAt),
    updatedAt:
      fund.updatedAt instanceof Date ? fund.updatedAt.toISOString() : String(fund.updatedAt),
    version: Number(fund.version),
  };
}
