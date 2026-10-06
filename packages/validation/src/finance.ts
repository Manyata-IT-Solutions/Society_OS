import { z } from 'zod';

export const AccountingEntityStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const AccountTypeSchema = z.enum([
  'ASSET',
  'LIABILITY',
  'FUND_BALANCE',
  'INCOME',
  'EXPENSE',
]);
export const AccountSubTypeSchema = z.enum([
  'CASH',
  'BANK',
  'ACCOUNTS_RECEIVABLE',
  'RESIDENT_ADVANCE',
  'SECURITY_DEPOSIT',
  'INVENTORY',
  'FIXED_ASSET',
  'OTHER_CURRENT_ASSET',
  'ACCOUNTS_PAYABLE',
  'VENDOR_ADVANCE',
  'TAX_PAYABLE',
  'ACCRUED_LIABILITY',
  'OTHER_CURRENT_LIABILITY',
  'MAINTENANCE_INCOME',
  'INTEREST_INCOME',
  'AMENITY_INCOME',
  'PENALTY_INCOME',
  'OTHER_INCOME',
  'REPAIRS_EXPENSE',
  'UTILITIES_EXPENSE',
  'SECURITY_EXPENSE',
  'HOUSEKEEPING_EXPENSE',
  'ADMIN_EXPENSE',
  'PROFESSIONAL_FEES',
  'INSURANCE_EXPENSE',
  'OTHER_EXPENSE',
]);
export const NormalBalanceSchema = z.enum(['DEBIT', 'CREDIT']);
export const FiscalYearStatusSchema = z.enum(['OPEN', 'CLOSING', 'CLOSED']);
export const PeriodStatusSchema = z.enum(['OPEN', 'SOFT_CLOSED', 'HARD_CLOSED']);
export const FundTypeSchema = z.enum([
  'OPERATING',
  'SINKING',
  'CORPUS',
  'RESERVE',
  'SPECIAL_PURPOSE',
]);
export const FundRestrictionTypeSchema = z.enum(['UNRESTRICTED', 'RESTRICTED', 'DESIGNATED']);
export const JournalTypeSchema = z.enum([
  'GENERAL',
  'OPENING',
  'ADJUSTMENT',
  'ACCRUAL',
  'REVERSAL',
  'SYSTEM',
  'RECLASSIFICATION',
  'RECURRING',
]);
export const JournalStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_APPROVAL',
  'APPROVED',
  'POSTED',
  'REVERSED',
  'CANCELLED',
]);

export const CreateAccountingEntitySchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid().optional().nullable(),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Alphanumeric code required'),
  name: z.string().min(2).max(255),
  legalName: z.string().min(2).max(255),
  countryCode: z.string().length(3).default('IND'),
  baseCurrency: z.string().min(3).max(10).default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  status: AccountingEntityStatusSchema.default('ACTIVE'),
});

export const UpdateAccountingEntitySchema = CreateAccountingEntitySchema.partial().omit({
  organizationId: true,
  code: true,
});

export const CreateFiscalYearSchema = z.object({
  accountingEntityId: z.string().uuid(),
  fiscalCalendarId: z.string().uuid().optional(),
  name: z.string().min(2).max(50),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  generatePeriods: z.boolean().default(true),
});

export const ClosePeriodSchema = z.object({
  mode: z.enum(['SOFT_CLOSE', 'HARD_CLOSE']),
  reason: z.string().optional(),
});

export const ReopenPeriodSchema = z.object({
  reason: z.string().min(5, 'Reopen reason is mandatory for financial audit'),
});

export const CreateLedgerAccountSchema = z.object({
  accountingEntityId: z.string().uuid(),
  accountCode: z.string().min(1).max(50),
  name: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  accountType: AccountTypeSchema,
  accountSubType: AccountSubTypeSchema,
  parentAccountId: z.string().uuid().optional().nullable(),
  postingAllowed: z.boolean().default(true),
  normalBalance: NormalBalanceSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
  systemAccountKey: z.string().max(100).optional().nullable(),
  isControlAccount: z.boolean().default(false),
  allowManualPosting: z.boolean().default(true),
  reconciliationRequired: z.boolean().default(false),
  currencyRestriction: z.string().max(10).optional().nullable(),
});

export const UpdateLedgerAccountSchema = CreateLedgerAccountSchema.partial().omit({
  accountingEntityId: true,
});

export const CreateAccountMappingSchema = z.object({
  accountingEntityId: z.string().uuid(),
  mappingKey: z.string().min(2).max(100),
  accountId: z.string().uuid(),
  description: z.string().optional().nullable(),
});

export const CreateCostCenterSchema = z.object({
  accountingEntityId: z.string().uuid(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  parentCostCenterId: z.string().uuid().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const UpdateCostCenterSchema = CreateCostCenterSchema.partial().omit({
  accountingEntityId: true,
  code: true,
});

export const CreateFundSchema = z.object({
  accountingEntityId: z.string().uuid(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  fundType: FundTypeSchema.default('OPERATING'),
  restrictionType: FundRestrictionTypeSchema.default('UNRESTRICTED'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const UpdateFundSchema = CreateFundSchema.partial().omit({
  accountingEntityId: true,
  code: true,
});

export const JournalLineInputSchema = z
  .object({
    accountId: z.string().uuid(),
    description: z.string().min(1),
    debitAmount: z.number().min(0).default(0),
    creditAmount: z.number().min(0).default(0),
    costCenterId: z.string().uuid().optional().nullable(),
    fundId: z.string().uuid().optional().nullable(),
    partyType: z.string().optional().nullable(),
    partyId: z.string().optional().nullable(),
    dimensions: z.record(z.any()).optional().default({}),
    sourceLineReference: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const hasDebit = (data.debitAmount ?? 0) > 0;
      const hasCredit = (data.creditAmount ?? 0) > 0;
      return (hasDebit || hasCredit) && !(hasDebit && hasCredit);
    },
    { message: 'Line must have either positive debit or positive credit, but not both or neither' },
  );

export const CreateJournalEntrySchema = z
  .object({
    accountingEntityId: z.string().uuid(),
    journalType: JournalTypeSchema.default('GENERAL'),
    journalDate: z.string().or(z.date()),
    description: z.string().min(3),
    reference: z.string().optional().nullable(),
    sourceModule: z.string().optional().nullable(),
    sourceType: z.string().optional().nullable(),
    sourceId: z.string().optional().nullable(),
    postingPurpose: z.string().optional().nullable(),
    currency: z.string().default('INR'),
    exchangeRate: z.number().positive().optional().nullable(),
    idempotencyKey: z.string().optional().nullable(),
    lines: z.array(JournalLineInputSchema).min(2, 'A journal entry must contain at least 2 lines'),
  })
  .refine(
    (data) => {
      const totalDr = data.lines.reduce((sum, l) => sum + (Number(l.debitAmount) || 0), 0);
      const totalCr = data.lines.reduce((sum, l) => sum + (Number(l.creditAmount) || 0), 0);
      return Math.abs(totalDr - totalCr) < 0.001;
    },
    { message: 'Journal Entry is out of balance: Total Debits must equal Total Credits' },
  );

export const UpdateJournalDraftSchema = z.object({
  journalDate: z.string().or(z.date()).optional(),
  description: z.string().min(3).optional(),
  reference: z.string().optional().nullable(),
  lines: z.array(JournalLineInputSchema).min(2).optional(),
});

export const ReverseJournalSchema = z.object({
  reversalDate: z.string().or(z.date()).optional(),
  reason: z.string().min(3, 'Reversal reason is mandatory'),
});

export const ImportOpeningBalancesSchema = z.object({
  accountingEntityId: z.string().uuid(),
  fiscalYearId: z.string().uuid(),
  asOfDate: z.string().or(z.date()),
  entries: z
    .array(
      z.object({
        accountCode: z.string(),
        debitAmount: z.number().min(0).default(0),
        creditAmount: z.number().min(0).default(0),
        fundCode: z.string().optional().nullable(),
        costCenterCode: z.string().optional().nullable(),
        description: z.string().optional(),
      }),
    )
    .min(2, 'Opening balances require at least 2 balancing entries'),
});
