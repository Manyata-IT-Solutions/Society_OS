export interface SupplierInvoiceResponseDto {
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
  invoiceType: string;
  sourceType: string;
  purchaseOrderId?: string | null;
  poNumber?: string | null;
  status: string;
  matchingStatus: string;
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
  lines?: any[];
  matchExceptions?: any[];
  createdAt: string;
}

export interface VendorPaymentResponseDto {
  id: string;
  paymentRunId?: string | null;
  vendorAccountId: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  bankAccountId?: string | null;
  referenceNumber: string;
  status: string;
  postingJournalId?: string | null;
  createdAt: string;
}
