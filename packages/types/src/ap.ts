export type SupplierInvoiceType =
  'PO_GOODS' | 'PO_SERVICE' | 'NON_PO_EXPENSE' | 'ADVANCE_REQUEST' | 'OTHER';

export type SupplierInvoiceSourceType = 'PO' | 'DIRECT' | 'RECURRING';

export type SupplierInvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VALIDATING'
  | 'MATCHING'
  | 'EXCEPTION'
  | 'UNDER_APPROVAL'
  | 'APPROVED'
  | 'POSTED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'REVERSED';

export type MatchingStatus =
  | 'NOT_REQUIRED'
  | 'NOT_STARTED'
  | 'MATCHED'
  | 'MATCHED_WITHIN_TOLERANCE'
  | 'EXCEPTION'
  | 'OVERRIDDEN';

export type MatchExceptionType =
  | 'PRICE_VARIANCE'
  | 'QUANTITY_VARIANCE'
  | 'MISSING_GRN'
  | 'MISSING_SERVICE_ACCEPTANCE'
  | 'VENDOR_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'UOM_MISMATCH'
  | 'DUPLICATE_INVOICE'
  | 'OVER_INVOICE'
  | 'TAX_VARIANCE'
  | 'FREIGHT_VARIANCE'
  | 'PO_CLOSED'
  | 'PO_CANCELLED'
  | 'REJECTED_GOODS'
  | 'OTHER';

export type MatchResolutionType =
  | 'CORRECT_INVOICE'
  | 'WAIT_FOR_GRN'
  | 'WAIT_FOR_SERVICE_ACCEPTANCE'
  | 'REQUEST_VENDOR_CREDIT_NOTE'
  | 'APPROVE_VARIANCE'
  | 'REJECT_INVOICE'
  | 'LINK_CORRECT_PO'
  | 'OTHER';

export type VendorLedgerEntryType =
  | 'OPENING'
  | 'SUPPLIER_INVOICE'
  | 'CREDIT_NOTE'
  | 'DEBIT_ADJUSTMENT'
  | 'PAYMENT'
  | 'PAYMENT_REVERSAL'
  | 'ADVANCE_PAYMENT'
  | 'ADVANCE_ALLOCATION'
  | 'ADJUSTMENT';

export type PaymentProposalStatus =
  'DRAFT' | 'PROPOSED' | 'UNDER_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';

export type PaymentRunStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'UNDER_APPROVAL'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type VendorPaymentStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELLED';

export type VendorPaymentMethod =
  'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'NEFT' | 'RTGS' | 'CARD';

export type VendorAdvanceStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'REVERSED'
  | 'CANCELLED';

export type SupplierCreditNoteStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'POSTED'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'CANCELLED'
  | 'REVERSED';

export interface VendorAccountSummary {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  accountingEntityId: string;
  accountNumber: string;
  currency: string;
  status: string;
  currentPayable: number;
  advanceBalance: number;
  creditBalance: number;
  lastInvoiceDate?: string | null;
  lastPaymentDate?: string | null;
}

export interface SupplierInvoiceSummary {
  id: string;
  organizationId: string;
  accountingEntityId: string;
  communityId?: string | null;
  vendorId: string;
  vendorName?: string;
  vendorAccountId: string;
  supplierInvoiceNumber: string;
  internalInvoiceNumber: string;
  normalizedInvoiceNumber: string;
  invoiceDate: string;
  receivedDate: string;
  postingDate: string;
  dueDate: string;
  currency: string;
  invoiceType: SupplierInvoiceType;
  sourceType: SupplierInvoiceSourceType;
  purchaseOrderId?: string | null;
  poNumber?: string | null;
  status: SupplierInvoiceStatus;
  matchingStatus: MatchingStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  freightTotal: number;
  otherCharges: number;
  roundingAmount: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  isOnHold: boolean;
  holdReason?: string | null;
  documentId?: string | null;
  postingJournalId?: string | null;
  linesCount?: number;
  createdAt: string;
}

export interface SupplierInvoiceLineItem {
  id?: string;
  lineNumber: number;
  poLineId?: string | null;
  grnLineId?: string | null;
  serviceReceiptLineId?: string | null;
  inventoryItemId?: string | null;
  description: string;
  quantity: number;
  uom?: string | null;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  freightAmount: number;
  otherCharges: number;
  netAmount: number;
  expenseAccountMapping?: string | null;
  fundId?: string | null;
  costCenterId?: string | null;
  assetId?: string | null;
  workOrderId?: string | null;
}

export interface MatchExceptionDetail {
  id: string;
  supplierInvoiceId: string;
  lineId?: string | null;
  exceptionType: MatchExceptionType;
  expectedValue: string;
  actualValue: string;
  varianceValue: number;
  toleranceAllowed: number;
  severity: 'WARNING' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED' | 'OVERRIDDEN';
  resolutionType?: MatchResolutionType | null;
  resolutionReason?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
}

export interface ApAgingSummary {
  accountingEntityId: string;
  asOfDate: string;
  totalPayable: number;
  notDue: number;
  bucket0to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket91to120: number;
  bucket120Plus: number;
  vendorCount: number;
  invoiceCount: number;
}
