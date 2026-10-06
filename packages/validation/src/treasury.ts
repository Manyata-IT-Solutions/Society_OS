import { z } from 'zod';

export const CreateBankAccountSchema = z.object({
  accountingEntityId: z.string().uuid(),
  name: z.string().min(2).max(100),
  bankName: z.string().min(2).max(100),
  accountType: z.enum(['CURRENT', 'SAVINGS', 'ESCROW', 'SWEEP', 'PETTY_CASH']).default('CURRENT'),
  currency: z.string().default('INR'),
  accountNumber: z.string().min(4).max(50),
  routingCode: z.string().min(4).max(50).optional().nullable(),
  glAccountId: z.string().uuid(),
  isDefault: z.boolean().default(false),
});

export const ImportBankStatementSchema = z.object({
  bankAccountId: z.string().uuid(),
  statementReference: z.string().min(1),
  periodStart: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  periodEnd: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  openingBalance: z.number(),
  closingBalance: z.number(),
  currency: z.string().default('INR'),
  transactions: z
    .array(
      z.object({
        transactionDate: z
          .string()
          .datetime()
          .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        valueDate: z
          .string()
          .datetime()
          .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
          .optional(),
        description: z.string().min(1),
        bankReference: z.string().optional().nullable(),
        amount: z.number().positive(),
        direction: z.enum(['DEBIT', 'CREDIT']),
        runningBalance: z.number().optional().nullable(),
      }),
    )
    .min(1),
});

export const ManualBankMatchSchema = z.object({
  bankTransactionId: z.string().uuid(),
  matchedEntityType: z.enum(['VENDOR_PAYMENT', 'RESIDENT_PAYMENT', 'JOURNAL_ENTRY']),
  matchedEntityId: z.string().uuid(),
  notes: z.string().optional().nullable(),
});

export const CreateBankFeeJournalSchema = z.object({
  bankTransactionId: z.string().uuid(),
  expenseAccountId: z.string().uuid(),
  description: z.string().min(3),
  costCenterId: z.string().uuid().optional().nullable(),
  fundId: z.string().uuid().optional().nullable(),
});

export const CompleteReconciliationSchema = z.object({
  notes: z.string().optional().nullable(),
  allowDifferenceOverride: z.boolean().default(false),
  overrideReason: z.string().optional(),
});
