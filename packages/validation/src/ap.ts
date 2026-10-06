import { z } from 'zod';

export const CreateSupplierInvoiceLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  poLineId: z.string().uuid().optional().nullable(),
  grnLineId: z.string().uuid().optional().nullable(),
  serviceReceiptLineId: z.string().uuid().optional().nullable(),
  inventoryItemId: z.string().uuid().optional().nullable(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  uom: z.string().optional().nullable(),
  unitPrice: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  freightAmount: z.number().nonnegative().default(0),
  otherCharges: z.number().nonnegative().default(0),
  netAmount: z.number().nonnegative(),
  expenseAccountMapping: z.string().optional().nullable(),
  fundId: z.string().uuid().optional().nullable(),
  costCenterId: z.string().uuid().optional().nullable(),
  assetId: z.string().uuid().optional().nullable(),
  workOrderId: z.string().uuid().optional().nullable(),
});

export const CreateSupplierInvoiceSchema = z.object({
  organizationId: z.string().uuid(),
  accountingEntityId: z.string().uuid(),
  communityId: z.string().uuid().optional().nullable(),
  vendorId: z.string().uuid(),
  vendorAccountId: z.string().uuid().optional().nullable(),
  supplierInvoiceNumber: z.string().min(1).max(100),
  invoiceDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  receivedDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  postingDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  dueDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  currency: z.string().default('INR'),
  invoiceType: z
    .enum(['PO_GOODS', 'PO_SERVICE', 'NON_PO_EXPENSE', 'ADVANCE_REQUEST', 'OTHER'])
    .default('PO_GOODS'),
  sourceType: z.enum(['PO', 'DIRECT', 'RECURRING']).default('PO'),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  paymentTermsId: z.string().uuid().optional().nullable(),
  documentId: z.string().uuid().optional().nullable(),
  lines: z.array(CreateSupplierInvoiceLineSchema).min(1),
  notes: z.string().optional().nullable(),
});

export const ResolveMatchExceptionSchema = z.object({
  resolutionType: z.enum([
    'CORRECT_INVOICE',
    'WAIT_FOR_GRN',
    'WAIT_FOR_SERVICE_ACCEPTANCE',
    'REQUEST_VENDOR_CREDIT_NOTE',
    'APPROVE_VARIANCE',
    'REJECT_INVOICE',
    'LINK_CORRECT_PO',
    'OTHER',
  ]),
  resolutionReason: z.string().min(3),
});

export const CreateSupplierCreditNoteSchema = z.object({
  organizationId: z.string().uuid(),
  accountingEntityId: z.string().uuid(),
  vendorId: z.string().uuid(),
  supplierInvoiceId: z.string().uuid().optional().nullable(),
  vendorCreditReference: z.string().min(1).max(100),
  creditNoteDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  currency: z.string().default('INR'),
  amount: z.number().positive(),
  reason: z.string().min(3),
  taxAmount: z.number().nonnegative().default(0),
});

export const CreatePaymentProposalSchema = z.object({
  accountingEntityId: z.string().uuid(),
  communityId: z.string().uuid().optional().nullable(),
  bankAccountId: z.string().uuid(),
  dueThroughDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  vendorId: z.string().uuid().optional().nullable(),
  paymentMethod: z
    .enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'NEFT', 'RTGS', 'CARD'])
    .default('BANK_TRANSFER'),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().positive().optional(),
});

export const RecordVendorPaymentSchema = z.object({
  accountingEntityId: z.string().uuid(),
  communityId: z.string().uuid().optional().nullable(),
  vendorAccountId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  paymentDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  paymentMethod: z
    .enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'NEFT', 'RTGS', 'CARD'])
    .default('BANK_TRANSFER'),
  referenceNumber: z.string().min(1),
  chequeNumber: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
  allocations: z
    .array(
      z.object({
        supplierInvoiceId: z.string().uuid(),
        amount: z.number().positive(),
      }),
    )
    .optional(),
});

export const CreateVendorAdvanceSchema = z.object({
  organizationId: z.string().uuid(),
  accountingEntityId: z.string().uuid(),
  communityId: z.string().uuid().optional().nullable(),
  vendorId: z.string().uuid(),
  vendorAccountId: z.string().uuid().optional().nullable(),
  bankAccountId: z.string().uuid(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  paymentMethod: z
    .enum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'NEFT', 'RTGS', 'CARD'])
    .default('BANK_TRANSFER'),
  paymentDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  referenceNumber: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export const AllocateVendorAdvanceSchema = z.object({
  supplierInvoiceId: z.string().uuid(),
  amount: z.number().positive(),
});
