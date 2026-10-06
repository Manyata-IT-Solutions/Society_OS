import { z } from 'zod';

export const CreateBillableAccountSchema = z.object({
  communityId: z.string().uuid(),
  accountNumber: z.string().min(1).max(100),
  accountType: z.enum(['UNIT', 'HOUSEHOLD', 'OWNER', 'TENANT', 'COMPANY', 'OTHER']).default('UNIT'),
  displayName: z.string().min(1).max(255),
  unitId: z.string().uuid().optional().nullable(),
  householdId: z.string().uuid().optional().nullable(),
  residentId: z.string().uuid().optional().nullable(),
  effectiveFrom: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateBillingPlanSchema = z.object({
  communityId: z.string().uuid(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  recurrenceType: z
    .enum(['MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'ONE_TIME', 'CUSTOM'])
    .default('MONTHLY'),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const CreateChargeDefinitionSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  category: z
    .enum([
      'MAINTENANCE',
      'UTILITY',
      'FUND',
      'AMENITY',
      'PARKING',
      'SPECIAL',
      'PENALTY',
      'INTEREST',
      'ADMINISTRATIVE',
      'OTHER',
    ])
    .default('MAINTENANCE'),
  chargeNature: z
    .enum([
      'FIXED',
      'AREA_BASED',
      'UNIT_BASED',
      'OCCUPANCY_BASED',
      'METER_BASED',
      'FORMULA_BASED',
      'MANUAL',
    ])
    .default('AREA_BASED'),
  recurrenceType: z
    .enum(['MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'ONE_TIME', 'CUSTOM'])
    .default('MONTHLY'),
  defaultCalculation: z
    .enum([
      'FIXED_AMOUNT',
      'PER_SQFT',
      'PER_SQM',
      'PER_UNIT',
      'PER_PARKING',
      'MANUAL',
      'SAFE_RULE_EXPRESSION',
    ])
    .default('PER_SQFT'),
  defaultUOM: z.string().max(20).optional().nullable(),
  taxable: z.boolean().default(false),
  accountingMappingKey: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
});

export const CreateChargeRuleSchema = z.object({
  billingPlanId: z.string().uuid(),
  chargeDefinitionId: z.string().uuid(),
  calculationMethod: z.enum([
    'FIXED_AMOUNT',
    'PER_SQFT',
    'PER_SQM',
    'PER_UNIT',
    'PER_PARKING',
    'MANUAL',
    'SAFE_RULE_EXPRESSION',
  ]),
  amount: z.number().min(0).default(0),
  rate: z.number().min(0).default(0),
  minimumAmount: z.number().min(0).optional().nullable(),
  maximumAmount: z.number().min(0).optional().nullable(),
  roundingPolicy: z.string().default('NEAREST_INTEGER'),
  dueDays: z.number().int().min(1).default(10),
  graceDays: z.number().int().min(0).default(5),
  fundId: z.string().uuid().optional().nullable(),
  costCenterId: z.string().uuid().optional().nullable(),
  accountingMappingKey: z.string().optional().nullable(),
  priority: z.number().int().default(10),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const CreateBillingPeriodSchema = z.object({
  communityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  invoiceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  graceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const CreateBillingRunSchema = z.object({
  communityId: z.string().uuid(),
  billingPeriodId: z.string().uuid(),
  billingPlanId: z.string().uuid(),
  runPurpose: z.string().default('REGULAR'),
  idempotencyKey: z.string().min(1).max(255),
});

export const RecordPaymentSchema = z.object({
  communityId: z.string().uuid(),
  billableAccountId: z.string().uuid(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  receivedAmount: z.number().positive(),
  currency: z.string().default('INR'),
  paymentMethod: z.enum([
    'CASH',
    'CHEQUE',
    'BANK_TRANSFER',
    'UPI',
    'CARD',
    'PAYMENT_GATEWAY',
    'NEFT',
    'RTGS',
    'IMPS',
    'OTHER',
  ]),
  referenceNumber: z.string().max(100).optional().nullable(),
  chequeNumber: z.string().max(50).optional().nullable(),
  chequeDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  chequeBank: z.string().max(100).optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
  autoAllocate: z.boolean().default(true),
  allocationRule: z
    .enum([
      'OLDEST_DUE_FIRST',
      'OLDEST_INVOICE_FIRST',
      'CURRENT_INVOICE_FIRST',
      'MANUAL',
      'SPECIFIC_INVOICE',
      'PROPORTIONAL',
    ])
    .default('OLDEST_DUE_FIRST'),
});

export const ManualAllocatePaymentSchema = z.object({
  paymentId: z.string().uuid(),
  allocations: z
    .array(
      z.object({
        invoiceId: z.string().uuid(),
        amount: z.number().positive(),
      }),
    )
    .min(1),
});

export const CreateWaiverRequestSchema = z.object({
  communityId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(5).max(1000),
});

export const ApproveWaiverSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional().nullable(),
});

export const CreateCreditNoteSchema = z.object({
  communityId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(5).max(1000),
});

export const ReversePaymentSchema = z.object({
  reason: z.string().min(5).max(1000),
});

export const ImportResidentOpeningBalancesSchema = z.object({
  communityId: z.string().uuid(),
  records: z
    .array(
      z.object({
        unitNumber: z.string().min(1),
        accountDisplayName: z.string().min(1),
        accountType: z
          .enum(['UNIT', 'HOUSEHOLD', 'OWNER', 'TENANT', 'COMPANY', 'OTHER'])
          .default('UNIT'),
        openingOutstanding: z.number().min(0).default(0),
        openingAdvanceCredit: z.number().min(0).default(0),
        asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .min(1),
});
