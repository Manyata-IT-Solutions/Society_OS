export type VendorType =
  | 'SUPPLIER'
  | 'SERVICE_PROVIDER'
  | 'CONTRACTOR'
  | 'CONSULTANT'
  | 'AMC_PROVIDER'
  | 'UTILITY_PROVIDER'
  | 'OTHER';

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED' | 'ARCHIVED';

export type VendorOnboardingStatus =
  'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED_DOCUMENTS';

export type VendorRiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type VendorContactType =
  'SALES' | 'SERVICE' | 'ACCOUNTS' | 'ESCALATION' | 'TECHNICAL' | 'MANAGEMENT' | 'OTHER';

export type VendorAddressType = 'REGISTERED' | 'BILLING' | 'SHIPPING' | 'BRANCH' | 'SERVICE_CENTER';

export type VendorTaxRegistrationType = 'GSTIN' | 'PAN' | 'MSME' | 'VAT' | 'EIN' | 'CUSTOM';

export type VendorDocumentType =
  | 'GST_CERTIFICATE'
  | 'PAN_PROOF'
  | 'REGISTRATION_CERTIFICATE'
  | 'MSME_CERTIFICATE'
  | 'INSURANCE_CERTIFICATE'
  | 'LICENSE'
  | 'SERVICE_CERTIFICATE'
  | 'NDA'
  | 'CONTRACT'
  | 'BANK_PROOF'
  | 'OTHER';

export type PurchaseRequisitionType = 'GOODS' | 'SERVICE' | 'MIXED';

export type PurchaseRequisitionPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type PurchaseRequisitionSource =
  | 'MANUAL'
  | 'INVENTORY_REORDER'
  | 'WORK_ORDER_MATERIAL_SHORTAGE'
  | 'MAINTENANCE_PLAN'
  | 'ASSET_REQUIREMENT'
  | 'OTHER';

export type PurchaseRequisitionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SOURCING'
  | 'ORDERED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'CLOSED';

export type ProcurementLineType = 'CATALOG_ITEM' | 'NON_CATALOG_ITEM' | 'SERVICE';

export type RfqStatus =
  'DRAFT' | 'PUBLISHED' | 'OPEN' | 'CLOSED' | 'EVALUATION' | 'AWARDED' | 'CANCELLED';

export type RfqInvitationStatus = 'INVITED' | 'VIEWED' | 'RESPONDED' | 'DECLINED' | 'EXPIRED';

export type VendorQuotationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_EVALUATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'LATE_ACCEPTED';

export type TechnicalComplianceStatus =
  'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' | 'NOT_EVALUATED';

export type SourcingAwardStatus =
  'DRAFT' | 'RECOMMENDED' | 'UNDER_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PO_CREATED' | 'CANCELLED';

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'UNDER_APPROVAL'
  | 'APPROVED'
  | 'ISSUED'
  | 'ACKNOWLEDGED'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'SHORT_CLOSED'
  | 'CANCELLED'
  | 'CLOSED';

export type PurchaseOrderType = 'GOODS' | 'SERVICE' | 'MIXED';

export type VendorAcknowledgementStatus =
  'PENDING' | 'ACKNOWLEDGED' | 'ACCEPTED' | 'REJECTED' | 'CHANGE_REQUESTED';

export type GoodsReceiptNoteStatus =
  | 'DRAFT'
  | 'RECEIVED'
  | 'UNDER_INSPECTION'
  | 'ACCEPTED'
  | 'PARTIALLY_ACCEPTED'
  | 'REJECTED'
  | 'POSTED'
  | 'CANCELLED';

export type GrnInspectionStatus =
  'NOT_REQUIRED' | 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONALLY_PASSED';

export type GrnRejectionDisposition =
  'RETURN_TO_VENDOR' | 'REPLACEMENT_EXPECTED' | 'SCRAP' | 'OTHER';

export type ServiceReceiptNoteStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'ACCEPTED' | 'REJECTED';

export type VendorRatingCategory =
  'QUALITY' | 'DELIVERY_PUNCTUALITY' | 'COMMUNICATION' | 'SERVICE_EXCELLENCE' | 'OVERALL';

// Domain Entities
export interface Vendor {
  id: string;
  organizationId: string;
  vendorCode: string;
  legalName: string;
  displayName: string;
  vendorType: VendorType;
  status: VendorStatus;
  onboardingStatus: VendorOnboardingStatus;
  countryCode: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  website: string | null;
  paymentTerms: string | null;
  riskRating: VendorRiskRating;
  isPreferred: boolean;
  createdById: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  blacklistedAt: string | null;
  blacklistReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorContact {
  id: string;
  vendorId: string;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  contactType: VendorContactType;
  isPrimary: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorAddress {
  id: string;
  vendorId: string;
  addressType: VendorAddressType;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorTaxRegistration {
  id: string;
  vendorId: string;
  countryCode: string;
  registrationType: VendorTaxRegistrationType;
  registrationNumber: string;
  validFrom: string | null;
  validTo: string | null;
  status: string;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDocument {
  id: string;
  vendorId: string;
  documentType: VendorDocumentType;
  documentId: string | null;
  documentNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  isExpiryTracked: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorCapability {
  id: string;
  vendorId: string;
  inventoryCategoryId: string | null;
  serviceCategoryKey: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequisition {
  id: string;
  organizationId: string;
  communityId: string;
  requisitionNumber: string;
  title: string;
  description: string | null;
  requestType: PurchaseRequisitionType;
  priority: PurchaseRequisitionPriority;
  requestingDepartment: string | null;
  requestedById: string | null;
  requiredByDate: string | null;
  targetStoreId: string | null;
  sourceType: PurchaseRequisitionSource;
  sourceReferenceId: string | null;
  workflowInstanceId: string | null;
  approvalRequestId: string | null;
  status: PurchaseRequisitionStatus;
  currency: string;
  estimatedTotalAmount: number;
  justification: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequisitionLine {
  id: string;
  requisitionId: string;
  lineNumber: number;
  lineType: ProcurementLineType;
  inventoryItemId: string | null;
  serviceCategoryKey: string | null;
  description: string;
  specification: string | null;
  quantity: number;
  uomId: string | null;
  uomName: string | null;
  estimatedUnitPrice: number | null;
  estimatedTotalPrice: number | null;
  requiredByDate: string | null;
  targetStoreId: string | null;
  linkedWorkOrderId: string | null;
  linkedWorkOrderMaterialRequirementId: string | null;
  linkedAssetId: string | null;
  orderedQty: number;
  fulfilledQty: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestForQuotation {
  id: string;
  organizationId: string;
  communityId: string;
  rfqNumber: string;
  title: string;
  description: string | null;
  currency: string;
  issueDate: string;
  submissionDeadline: string;
  status: RfqStatus;
  commercialTerms: string | null;
  deliveryTerms: string | null;
  deliveryLocation: string | null;
  deliveryRequiredBy: string | null;
  isSingleSourceAllowed: boolean;
  singleSourceJustification: string | null;
  isEmergency: boolean;
  emergencyJustification: string | null;
  minimumQuotationsRequired: number;
  isSealedBid: boolean;
  createdById: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RfqLine {
  id: string;
  rfqId: string;
  sourcePrLineId: string | null;
  lineNumber: number;
  lineType: ProcurementLineType;
  inventoryItemId: string | null;
  description: string;
  specification: string | null;
  quantity: number;
  uomId: string | null;
  uomName: string | null;
  targetDeliveryDate: string | null;
  deliveryLocation: string | null;
  technicalRequirements: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RfqVendorInvitation {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorContactId: string | null;
  invitedAt: string;
  invitedById: string | null;
  status: RfqInvitationStatus;
  viewedAt: string | null;
  respondedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorQuotation {
  id: string;
  rfqId: string;
  vendorId: string;
  quotationNumber: string;
  vendorReferenceNumber: string | null;
  revision: number;
  isCurrentRevision: boolean;
  submittedAt: string;
  validUntil: string | null;
  currency: string;
  status: VendorQuotationStatus;
  isLateSubmission: boolean;
  lateSubmissionReason: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  freightTotal: number;
  otherCharges: number;
  grandTotal: number;
  deliveryLeadTimeDays: number | null;
  paymentTerms: string | null;
  warrantyTerms: string | null;
  technicalComplianceScore: number | null;
  commercialScore: number | null;
  totalScore: number | null;
  evaluationNotes: string | null;
  documentId: string | null;
  createdById: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorQuotationLine {
  id: string;
  quotationId: string;
  rfqLineId: string;
  lineNumber: number;
  description: string;
  offeredQuantity: number;
  uomId: string | null;
  uomName: string | null;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  freightAmount: number;
  otherChargesAmount: number;
  lineTotal: number;
  deliveryLeadTimeDays: number | null;
  brandName: string | null;
  modelNumber: string | null;
  offeredSpecification: string | null;
  isAlternateOffer: boolean;
  technicalCompliance: TechnicalComplianceStatus;
  complianceNotes: string | null;
  awardedQuantity: number;
  isAwarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SourcingAward {
  id: string;
  organizationId: string;
  communityId: string;
  awardNumber: string;
  rfqId: string;
  selectedVendorId: string | null;
  status: SourcingAwardStatus;
  approvalRequestId: string | null;
  isSplitAward: boolean;
  isSingleSource: boolean;
  isLowestPriceSelected: boolean;
  recommendationReason: string | null;
  decisionNotes: string | null;
  recommendedById: string | null;
  recommendedAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  communityId: string;
  poNumber: string;
  vendorId: string;
  sourceAwardId: string | null;
  currency: string;
  revision: number;
  isCurrentRevision: boolean;
  orderDate: string;
  deliveryRequiredBy: string | null;
  deliveryAddress: string | null;
  billingAddress: string | null;
  status: PurchaseOrderStatus;
  poType: PurchaseOrderType;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  freightTotal: number;
  otherCharges: number;
  grandTotal: number;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  warrantyTerms: string | null;
  termsAndConditions: string | null;
  workflowInstanceId: string | null;
  approvalRequestId: string | null;
  documentId: string | null;
  vendorAcknowledgementStatus: VendorAcknowledgementStatus;
  vendorAcknowledgedAt: string | null;
  vendorAcknowledgementNotes: string | null;
  createdById: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  issuedAt: string | null;
  shortClosedAt: string | null;
  shortCloseReason: string | null;
  closedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  lineNumber: number;
  lineType: ProcurementLineType;
  sourcePrLineId: string | null;
  sourceRfqLineId: string | null;
  sourceQuotationLineId: string | null;
  inventoryItemId: string | null;
  serviceCategoryKey: string | null;
  description: string;
  specificationSnapshot: string | null;
  orderedQty: number;
  uomId: string | null;
  uomName: string | null;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  targetStoreId: string | null;
  linkedWorkOrderId: string | null;
  linkedWorkOrderMaterialRequirementId: string | null;
  linkedAssetId: string | null;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  cancelledQty: number;
  remainingQty: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptNote {
  id: string;
  organizationId: string;
  communityId: string;
  grnNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  storeId: string;
  deliveryChallanNumber: string | null;
  vendorInvoiceReference: string | null;
  receivedAt: string;
  receivedById: string | null;
  status: GoodsReceiptNoteStatus;
  inspectionStatus: GrnInspectionStatus;
  inspectedById: string | null;
  inspectedAt: string | null;
  inspectionComments: string | null;
  inspectionEvidenceDocumentId: string | null;
  postedAt: string | null;
  inventoryReceiptId: string | null;
  notes: string | null;
  documentId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface GrnLine {
  id: string;
  grnId: string;
  poLineId: string;
  lineNumber: number;
  deliveredQty: number;
  acceptedQty: number;
  rejectedQty: number;
  damagedQty: number;
  uomId: string | null;
  binId: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  serialNumbers: string[];
  rejectionReason: string | null;
  rejectionDisposition: GrnRejectionDisposition | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceReceiptNote {
  id: string;
  organizationId: string;
  communityId: string;
  serviceReceiptNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  status: ServiceReceiptNoteStatus;
  verifiedById: string | null;
  acceptedById: string | null;
  acceptedAt: string | null;
  notes: string | null;
  documentId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceReceiptLine {
  id: string;
  serviceReceiptId: string;
  poLineId: string;
  description: string;
  deliveredQty: number;
  acceptedQty: number;
  uomName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPerformanceMetric {
  id: string;
  vendorId: string;
  periodStart: string;
  periodEnd: string;
  totalPurchaseOrders: number;
  completedPurchaseOrders: number;
  onTimeDeliveryRate: number;
  qualityAcceptanceRate: number;
  fulfillmentRate: number;
  quotationResponseRate: number;
  calculatedScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorRating {
  id: string;
  vendorId: string;
  purchaseOrderId: string | null;
  ratedById: string | null;
  ratingCategory: VendorRatingCategory;
  score: number;
  reviewComments: string | null;
  createdAt: string;
}

export interface QuotationComparisonMatrix {
  rfqId: string;
  rfqNumber: string;
  title: string;
  currency: string;
  submissionDeadline: string;
  isClosed: boolean;
  minQuotesRequired: number;
  isSingleSource: boolean;
  lines: Array<{
    rfqLineId: string;
    description: string;
    requestedQuantity: number;
    uomName: string | null;
    vendorQuotes: Array<{
      vendorId: string;
      vendorName: string;
      quotationId: string;
      quotationLineId: string;
      offeredQuantity: number;
      unitPrice: number;
      discountAmount: number;
      taxAmount: number;
      freightAmount: number;
      lineTotal: number;
      deliveryLeadTimeDays: number | null;
      brandName: string | null;
      isAlternateOffer: boolean;
      technicalCompliance: TechnicalComplianceStatus;
      isLowestPrice: boolean;
      score: number | null;
    }>;
  }>;
  summary: Array<{
    vendorId: string;
    vendorName: string;
    vendorCode: string;
    quotationId: string;
    subtotal: number;
    taxTotal: number;
    freightTotal: number;
    grandTotal: number;
    technicalScore: number | null;
    commercialScore: number | null;
    totalScore: number | null;
    isLowestCommercial: boolean;
    isRecommended: boolean;
    complianceStatus: string;
  }>;
}

export interface ProcurementKpiMetrics {
  openRequisitions: number;
  requisitionsPendingApproval: number;
  activeRfqs: number;
  rfqsClosingSoon: number;
  quotationsPendingEvaluation: number;
  purchaseOrdersPendingApproval: number;
  openPurchaseOrders: number;
  overdueDeliveries: number;
  grnsPendingInspection: number;
  totalCommittedSpend: number;
  totalVendorsActive: number;
  vendorsUnderReview: number;
}
