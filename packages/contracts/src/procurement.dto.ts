import type {
  VendorType,
  VendorStatus,
  VendorOnboardingStatus,
  VendorRiskRating,
  VendorContactType,
  VendorAddressType,
  VendorTaxRegistrationType,
  VendorDocumentType,
  PurchaseRequisitionType,
  PurchaseRequisitionPriority,
  PurchaseRequisitionSource,
  PurchaseRequisitionStatus,
  ProcurementLineType,
  RfqStatus,
  RfqInvitationStatus,
  VendorQuotationStatus,
  TechnicalComplianceStatus,
  SourcingAwardStatus,
  PurchaseOrderStatus,
  PurchaseOrderType,
  VendorAcknowledgementStatus,
  GoodsReceiptNoteStatus,
  GrnInspectionStatus,
  GrnRejectionDisposition,
  ServiceReceiptNoteStatus,
  VendorRatingCategory,
  EntityStatus,
} from '@community-os/types';

function toSafeIsoString(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return String(val);
}

function toRequiredIsoString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return String(val);
}

function toNumeric(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return val;
  if (
    typeof val === 'object' &&
    val !== null &&
    'toNumber' in val &&
    typeof (val as { toNumber: () => number }).toNumber === 'function'
  ) {
    return (val as { toNumber: () => number }).toNumber();
  }
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
}

// 1. Vendor DTOs
export interface VendorResponseDto {
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
  contacts?: VendorContactResponseDto[];
  addresses?: VendorAddressResponseDto[];
  taxRegistrations?: VendorTaxRegistrationResponseDto[];
  documents?: VendorDocumentResponseDto[];
  capabilities?: VendorCapabilityResponseDto[];
  communityLinks?: string[];
}

export function toVendorDto(vendor: any): VendorResponseDto {
  return {
    id: vendor.id,
    organizationId: vendor.organizationId,
    vendorCode: vendor.vendorCode,
    legalName: vendor.legalName,
    displayName: vendor.displayName,
    vendorType: vendor.vendorType,
    status: vendor.status,
    onboardingStatus: vendor.onboardingStatus,
    countryCode: vendor.countryCode,
    primaryEmail: vendor.primaryEmail ?? null,
    primaryPhone: vendor.primaryPhone ?? null,
    website: vendor.website ?? null,
    paymentTerms: vendor.paymentTerms ?? null,
    riskRating: vendor.riskRating,
    isPreferred: Boolean(vendor.isPreferred),
    createdById: vendor.createdById ?? null,
    approvedById: vendor.approvedById ?? null,
    approvedAt: toSafeIsoString(vendor.approvedAt),
    suspendedAt: toSafeIsoString(vendor.suspendedAt),
    suspensionReason: vendor.suspensionReason ?? null,
    blacklistedAt: toSafeIsoString(vendor.blacklistedAt),
    blacklistReason: vendor.blacklistReason ?? null,
    version: vendor.version,
    createdAt: toRequiredIsoString(vendor.createdAt),
    updatedAt: toRequiredIsoString(vendor.updatedAt),
    contacts: vendor.contacts ? vendor.contacts.map(toVendorContactDto) : undefined,
    addresses: vendor.addresses ? vendor.addresses.map(toVendorAddressDto) : undefined,
    taxRegistrations: vendor.taxRegistrations
      ? vendor.taxRegistrations.map(toVendorTaxRegistrationDto)
      : undefined,
    documents: vendor.documents ? vendor.documents.map(toVendorDocumentDto) : undefined,
    capabilities: vendor.capabilities ? vendor.capabilities.map(toVendorCapabilityDto) : undefined,
    communityLinks: vendor.communityLinks
      ? vendor.communityLinks.map((l: any) => l.communityId)
      : undefined,
  };
}

export interface VendorContactResponseDto {
  id: string;
  vendorId: string;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  contactType: VendorContactType;
  isPrimary: boolean;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export function toVendorContactDto(c: any): VendorContactResponseDto {
  return {
    id: c.id,
    vendorId: c.vendorId,
    name: c.name,
    designation: c.designation ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
    contactType: c.contactType,
    isPrimary: Boolean(c.isPrimary),
    status: c.status,
    createdAt: toRequiredIsoString(c.createdAt),
    updatedAt: toRequiredIsoString(c.updatedAt),
  };
}

export interface VendorAddressResponseDto {
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

export function toVendorAddressDto(a: any): VendorAddressResponseDto {
  return {
    id: a.id,
    vendorId: a.vendorId,
    addressType: a.addressType,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2 ?? null,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    countryCode: a.countryCode,
    isPrimary: Boolean(a.isPrimary),
    createdAt: toRequiredIsoString(a.createdAt),
    updatedAt: toRequiredIsoString(a.updatedAt),
  };
}

export interface VendorTaxRegistrationResponseDto {
  id: string;
  vendorId: string;
  countryCode: string;
  registrationType: VendorTaxRegistrationType;
  registrationNumber: string;
  validFrom: string | null;
  validTo: string | null;
  status: EntityStatus;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toVendorTaxRegistrationDto(t: any): VendorTaxRegistrationResponseDto {
  return {
    id: t.id,
    vendorId: t.vendorId,
    countryCode: t.countryCode,
    registrationType: t.registrationType,
    registrationNumber: t.registrationNumber,
    validFrom: toSafeIsoString(t.validFrom),
    validTo: toSafeIsoString(t.validTo),
    status: t.status,
    isVerified: Boolean(t.isVerified),
    verifiedAt: toSafeIsoString(t.verifiedAt),
    createdAt: toRequiredIsoString(t.createdAt),
    updatedAt: toRequiredIsoString(t.updatedAt),
  };
}

export interface VendorDocumentResponseDto {
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
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export function toVendorDocumentDto(d: any): VendorDocumentResponseDto {
  return {
    id: d.id,
    vendorId: d.vendorId,
    documentType: d.documentType,
    documentId: d.documentId ?? null,
    documentNumber: d.documentNumber ?? null,
    issuedAt: toSafeIsoString(d.issuedAt),
    expiresAt: toSafeIsoString(d.expiresAt),
    isExpiryTracked: Boolean(d.isExpiryTracked),
    isVerified: Boolean(d.isVerified),
    verifiedAt: toSafeIsoString(d.verifiedAt),
    status: d.status,
    createdAt: toRequiredIsoString(d.createdAt),
    updatedAt: toRequiredIsoString(d.updatedAt),
  };
}

export interface VendorCapabilityResponseDto {
  id: string;
  vendorId: string;
  inventoryCategoryId: string | null;
  serviceCategoryKey: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toVendorCapabilityDto(c: any): VendorCapabilityResponseDto {
  return {
    id: c.id,
    vendorId: c.vendorId,
    inventoryCategoryId: c.inventoryCategoryId ?? null,
    serviceCategoryKey: c.serviceCategoryKey ?? null,
    description: c.description ?? null,
    createdAt: toRequiredIsoString(c.createdAt),
    updatedAt: toRequiredIsoString(c.updatedAt),
  };
}

// 2. Purchase Requisition DTOs
export interface PurchaseRequisitionResponseDto {
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
  lines?: PurchaseRequisitionLineResponseDto[];
}

export function toPurchaseRequisitionDto(pr: any): PurchaseRequisitionResponseDto {
  return {
    id: pr.id,
    organizationId: pr.organizationId,
    communityId: pr.communityId,
    requisitionNumber: pr.requisitionNumber,
    title: pr.title,
    description: pr.description ?? null,
    requestType: pr.requestType,
    priority: pr.priority,
    requestingDepartment: pr.requestingDepartment ?? null,
    requestedById: pr.requestedById ?? null,
    requiredByDate: toSafeIsoString(pr.requiredByDate),
    targetStoreId: pr.targetStoreId ?? null,
    sourceType: pr.sourceType,
    sourceReferenceId: pr.sourceReferenceId ?? null,
    workflowInstanceId: pr.workflowInstanceId ?? null,
    approvalRequestId: pr.approvalRequestId ?? null,
    status: pr.status,
    currency: pr.currency,
    estimatedTotalAmount: toNumeric(pr.estimatedTotalAmount),
    justification: pr.justification ?? null,
    version: pr.version,
    createdAt: toRequiredIsoString(pr.createdAt),
    updatedAt: toRequiredIsoString(pr.updatedAt),
    lines: pr.lines ? pr.lines.map(toPurchaseRequisitionLineDto) : undefined,
  };
}

export interface PurchaseRequisitionLineResponseDto {
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

export function toPurchaseRequisitionLineDto(l: any): PurchaseRequisitionLineResponseDto {
  return {
    id: l.id,
    requisitionId: l.requisitionId,
    lineNumber: l.lineNumber,
    lineType: l.lineType,
    inventoryItemId: l.inventoryItemId ?? null,
    serviceCategoryKey: l.serviceCategoryKey ?? null,
    description: l.description,
    specification: l.specification ?? null,
    quantity: toNumeric(l.quantity),
    uomId: l.uomId ?? null,
    uomName: l.uomName ?? l.uom?.name ?? null,
    estimatedUnitPrice:
      l.estimatedUnitPrice !== null && l.estimatedUnitPrice !== undefined
        ? toNumeric(l.estimatedUnitPrice)
        : null,
    estimatedTotalPrice:
      l.estimatedTotalPrice !== null && l.estimatedTotalPrice !== undefined
        ? toNumeric(l.estimatedTotalPrice)
        : null,
    requiredByDate: toSafeIsoString(l.requiredByDate),
    targetStoreId: l.targetStoreId ?? null,
    linkedWorkOrderId: l.linkedWorkOrderId ?? null,
    linkedWorkOrderMaterialRequirementId: l.linkedWorkOrderMaterialRequirementId ?? null,
    linkedAssetId: l.linkedAssetId ?? null,
    orderedQty: toNumeric(l.orderedQty),
    fulfilledQty: toNumeric(l.fulfilledQty),
    createdAt: toRequiredIsoString(l.createdAt),
    updatedAt: toRequiredIsoString(l.updatedAt),
  };
}

// 3. RFQ DTOs
export interface RfqResponseDto {
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
  lines?: RfqLineResponseDto[];
  invitations?: RfqVendorInvitationResponseDto[];
}

export function toRfqDto(rfq: any): RfqResponseDto {
  return {
    id: rfq.id,
    organizationId: rfq.organizationId,
    communityId: rfq.communityId,
    rfqNumber: rfq.rfqNumber,
    title: rfq.title,
    description: rfq.description ?? null,
    currency: rfq.currency,
    issueDate: toRequiredIsoString(rfq.issueDate),
    submissionDeadline: toRequiredIsoString(rfq.submissionDeadline),
    status: rfq.status,
    commercialTerms: rfq.commercialTerms ?? null,
    deliveryTerms: rfq.deliveryTerms ?? null,
    deliveryLocation: rfq.deliveryLocation ?? null,
    deliveryRequiredBy: toSafeIsoString(rfq.deliveryRequiredBy),
    isSingleSourceAllowed: Boolean(rfq.isSingleSourceAllowed),
    singleSourceJustification: rfq.singleSourceJustification ?? null,
    isEmergency: Boolean(rfq.isEmergency),
    emergencyJustification: rfq.emergencyJustification ?? null,
    minimumQuotationsRequired: rfq.minimumQuotationsRequired,
    isSealedBid: Boolean(rfq.isSealedBid),
    createdById: rfq.createdById ?? null,
    publishedAt: toSafeIsoString(rfq.publishedAt),
    closedAt: toSafeIsoString(rfq.closedAt),
    version: rfq.version,
    createdAt: toRequiredIsoString(rfq.createdAt),
    updatedAt: toRequiredIsoString(rfq.updatedAt),
    lines: rfq.lines ? rfq.lines.map(toRfqLineDto) : undefined,
    invitations: rfq.invitations ? rfq.invitations.map(toRfqVendorInvitationDto) : undefined,
  };
}

export interface RfqLineResponseDto {
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

export function toRfqLineDto(l: any): RfqLineResponseDto {
  return {
    id: l.id,
    rfqId: l.rfqId,
    sourcePrLineId: l.sourcePrLineId ?? null,
    lineNumber: l.lineNumber,
    lineType: l.lineType,
    inventoryItemId: l.inventoryItemId ?? null,
    description: l.description,
    specification: l.specification ?? null,
    quantity: toNumeric(l.quantity),
    uomId: l.uomId ?? null,
    uomName: l.uomName ?? l.uom?.name ?? null,
    targetDeliveryDate: toSafeIsoString(l.targetDeliveryDate),
    deliveryLocation: l.deliveryLocation ?? null,
    technicalRequirements: l.technicalRequirements ?? null,
    createdAt: toRequiredIsoString(l.createdAt),
    updatedAt: toRequiredIsoString(l.updatedAt),
  };
}

export interface RfqVendorInvitationResponseDto {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName?: string;
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

export function toRfqVendorInvitationDto(inv: any): RfqVendorInvitationResponseDto {
  return {
    id: inv.id,
    rfqId: inv.rfqId,
    vendorId: inv.vendorId,
    vendorName: inv.vendor?.displayName ?? inv.vendor?.legalName,
    vendorContactId: inv.vendorContactId ?? null,
    invitedAt: toRequiredIsoString(inv.invitedAt),
    invitedById: inv.invitedById ?? null,
    status: inv.status,
    viewedAt: toSafeIsoString(inv.viewedAt),
    respondedAt: toSafeIsoString(inv.respondedAt),
    declinedAt: toSafeIsoString(inv.declinedAt),
    declineReason: inv.declineReason ?? null,
    createdAt: toRequiredIsoString(inv.createdAt),
    updatedAt: toRequiredIsoString(inv.updatedAt),
  };
}

// 4. Vendor Quotation DTOs
export interface VendorQuotationResponseDto {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName?: string;
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
  lines?: VendorQuotationLineResponseDto[];
}

export function toVendorQuotationDto(q: any): VendorQuotationResponseDto {
  return {
    id: q.id,
    rfqId: q.rfqId,
    vendorId: q.vendorId,
    vendorName: q.vendor?.displayName ?? q.vendor?.legalName,
    quotationNumber: q.quotationNumber,
    vendorReferenceNumber: q.vendorReferenceNumber ?? null,
    revision: q.revision,
    isCurrentRevision: Boolean(q.isCurrentRevision),
    submittedAt: toRequiredIsoString(q.submittedAt),
    validUntil: toSafeIsoString(q.validUntil),
    currency: q.currency,
    status: q.status,
    isLateSubmission: Boolean(q.isLateSubmission),
    lateSubmissionReason: q.lateSubmissionReason ?? null,
    subtotal: toNumeric(q.subtotal),
    discountTotal: toNumeric(q.discountTotal),
    taxTotal: toNumeric(q.taxTotal),
    freightTotal: toNumeric(q.freightTotal),
    otherCharges: toNumeric(q.otherCharges),
    grandTotal: toNumeric(q.grandTotal),
    deliveryLeadTimeDays: q.deliveryLeadTimeDays ?? null,
    paymentTerms: q.paymentTerms ?? null,
    warrantyTerms: q.warrantyTerms ?? null,
    technicalComplianceScore:
      q.technicalComplianceScore !== null && q.technicalComplianceScore !== undefined
        ? toNumeric(q.technicalComplianceScore)
        : null,
    commercialScore:
      q.commercialScore !== null && q.commercialScore !== undefined
        ? toNumeric(q.commercialScore)
        : null,
    totalScore:
      q.totalScore !== null && q.totalScore !== undefined ? toNumeric(q.totalScore) : null,
    evaluationNotes: q.evaluationNotes ?? null,
    documentId: q.documentId ?? null,
    createdById: q.createdById ?? null,
    version: q.version,
    createdAt: toRequiredIsoString(q.createdAt),
    updatedAt: toRequiredIsoString(q.updatedAt),
    lines: q.lines ? q.lines.map(toVendorQuotationLineDto) : undefined,
  };
}

export interface VendorQuotationLineResponseDto {
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

export function toVendorQuotationLineDto(l: any): VendorQuotationLineResponseDto {
  return {
    id: l.id,
    quotationId: l.quotationId,
    rfqLineId: l.rfqLineId,
    lineNumber: l.lineNumber,
    description: l.description,
    offeredQuantity: toNumeric(l.offeredQuantity),
    uomId: l.uomId ?? null,
    uomName: l.uomName ?? l.uom?.name ?? null,
    unitPrice: toNumeric(l.unitPrice),
    discountAmount: toNumeric(l.discountAmount),
    taxRate: toNumeric(l.taxRate),
    taxAmount: toNumeric(l.taxAmount),
    freightAmount: toNumeric(l.freightAmount),
    otherChargesAmount: toNumeric(l.otherChargesAmount),
    lineTotal: toNumeric(l.lineTotal),
    deliveryLeadTimeDays: l.deliveryLeadTimeDays ?? null,
    brandName: l.brandName ?? null,
    modelNumber: l.modelNumber ?? null,
    offeredSpecification: l.offeredSpecification ?? null,
    isAlternateOffer: Boolean(l.isAlternateOffer),
    technicalCompliance: l.technicalCompliance,
    complianceNotes: l.complianceNotes ?? null,
    awardedQuantity: toNumeric(l.awardedQuantity),
    isAwarded: Boolean(l.isAwarded),
    createdAt: toRequiredIsoString(l.createdAt),
    updatedAt: toRequiredIsoString(l.updatedAt),
  };
}

// 5. Sourcing Award DTOs
export interface SourcingAwardResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  awardNumber: string;
  rfqId: string;
  selectedVendorId: string | null;
  selectedVendorName?: string;
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
  lines?: SourcingAwardLineResponseDto[];
}

export function toSourcingAwardDto(a: any): SourcingAwardResponseDto {
  return {
    id: a.id,
    organizationId: a.organizationId,
    communityId: a.communityId,
    awardNumber: a.awardNumber,
    rfqId: a.rfqId,
    selectedVendorId: a.selectedVendorId ?? null,
    selectedVendorName: a.selectedVendor?.displayName ?? a.selectedVendor?.legalName,
    status: a.status,
    approvalRequestId: a.approvalRequestId ?? null,
    isSplitAward: Boolean(a.isSplitAward),
    isSingleSource: Boolean(a.isSingleSource),
    isLowestPriceSelected: Boolean(a.isLowestPriceSelected),
    recommendationReason: a.recommendationReason ?? null,
    decisionNotes: a.decisionNotes ?? null,
    recommendedById: a.recommendedById ?? null,
    recommendedAt: toSafeIsoString(a.recommendedAt),
    approvedById: a.approvedById ?? null,
    approvedAt: toSafeIsoString(a.approvedAt),
    version: a.version,
    createdAt: toRequiredIsoString(a.createdAt),
    updatedAt: toRequiredIsoString(a.updatedAt),
    lines: a.lines ? a.lines.map(toSourcingAwardLineDto) : undefined,
  };
}

export interface SourcingAwardLineResponseDto {
  id: string;
  awardId: string;
  rfqLineId: string;
  quotationId: string;
  quotationLineId: string;
  vendorId: string;
  vendorName?: string;
  awardedQuantity: number;
  uomId: string | null;
  unitPrice: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export function toSourcingAwardLineDto(l: any): SourcingAwardLineResponseDto {
  return {
    id: l.id,
    awardId: l.awardId,
    rfqLineId: l.rfqLineId,
    quotationId: l.quotationId,
    quotationLineId: l.quotationLineId,
    vendorId: l.vendorId,
    vendorName: l.vendor?.displayName ?? l.vendor?.legalName,
    awardedQuantity: toNumeric(l.awardedQuantity),
    uomId: l.uomId ?? null,
    unitPrice: toNumeric(l.unitPrice),
    lineTotal: toNumeric(l.lineTotal),
    createdAt: toRequiredIsoString(l.createdAt),
    updatedAt: toRequiredIsoString(l.updatedAt),
  };
}

// 6. Purchase Order DTOs
export interface PurchaseOrderResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  poNumber: string;
  vendorId: string;
  vendorName?: string;
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
  lines?: PurchaseOrderLineResponseDto[];
  revisions?: PurchaseOrderRevisionResponseDto[];
}

export function toPurchaseOrderDto(po: any): PurchaseOrderResponseDto {
  return {
    id: po.id,
    organizationId: po.organizationId,
    communityId: po.communityId,
    poNumber: po.poNumber,
    vendorId: po.vendorId,
    vendorName: po.vendor?.displayName ?? po.vendor?.legalName,
    sourceAwardId: po.sourceAwardId ?? null,
    currency: po.currency,
    revision: po.revision,
    isCurrentRevision: Boolean(po.isCurrentRevision),
    orderDate: toRequiredIsoString(po.orderDate),
    deliveryRequiredBy: toSafeIsoString(po.deliveryRequiredBy),
    deliveryAddress: po.deliveryAddress ?? null,
    billingAddress: po.billingAddress ?? null,
    status: po.status,
    poType: po.poType,
    subtotal: toNumeric(po.subtotal),
    discountTotal: toNumeric(po.discountTotal),
    taxTotal: toNumeric(po.taxTotal),
    freightTotal: toNumeric(po.freightTotal),
    otherCharges: toNumeric(po.otherCharges),
    grandTotal: toNumeric(po.grandTotal),
    paymentTerms: po.paymentTerms ?? null,
    deliveryTerms: po.deliveryTerms ?? null,
    warrantyTerms: po.warrantyTerms ?? null,
    termsAndConditions: po.termsAndConditions ?? null,
    workflowInstanceId: po.workflowInstanceId ?? null,
    approvalRequestId: po.approvalRequestId ?? null,
    documentId: po.documentId ?? null,
    vendorAcknowledgementStatus: po.vendorAcknowledgementStatus,
    vendorAcknowledgedAt: toSafeIsoString(po.vendorAcknowledgedAt),
    vendorAcknowledgementNotes: po.vendorAcknowledgementNotes ?? null,
    createdById: po.createdById ?? null,
    approvedById: po.approvedById ?? null,
    approvedAt: toSafeIsoString(po.approvedAt),
    issuedAt: toSafeIsoString(po.issuedAt),
    shortClosedAt: toSafeIsoString(po.shortClosedAt),
    shortCloseReason: po.shortCloseReason ?? null,
    closedAt: toSafeIsoString(po.closedAt),
    version: po.version,
    createdAt: toRequiredIsoString(po.createdAt),
    updatedAt: toRequiredIsoString(po.updatedAt),
    lines: po.lines ? po.lines.map(toPurchaseOrderLineDto) : undefined,
    revisions: po.revisions ? po.revisions.map(toPurchaseOrderRevisionDto) : undefined,
  };
}

export interface PurchaseOrderLineResponseDto {
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

export function toPurchaseOrderLineDto(l: any): PurchaseOrderLineResponseDto {
  return {
    id: l.id,
    purchaseOrderId: l.purchaseOrderId,
    lineNumber: l.lineNumber,
    lineType: l.lineType,
    sourcePrLineId: l.sourcePrLineId ?? null,
    sourceRfqLineId: l.sourceRfqLineId ?? null,
    sourceQuotationLineId: l.sourceQuotationLineId ?? null,
    inventoryItemId: l.inventoryItemId ?? null,
    serviceCategoryKey: l.serviceCategoryKey ?? null,
    description: l.description,
    specificationSnapshot: l.specificationSnapshot ?? null,
    orderedQty: toNumeric(l.orderedQty),
    uomId: l.uomId ?? null,
    uomName: l.uomName ?? l.uom?.name ?? null,
    unitPrice: toNumeric(l.unitPrice),
    discountAmount: toNumeric(l.discountAmount),
    taxAmount: toNumeric(l.taxAmount),
    lineTotal: toNumeric(l.lineTotal),
    targetStoreId: l.targetStoreId ?? null,
    linkedWorkOrderId: l.linkedWorkOrderId ?? null,
    linkedWorkOrderMaterialRequirementId: l.linkedWorkOrderMaterialRequirementId ?? null,
    linkedAssetId: l.linkedAssetId ?? null,
    receivedQty: toNumeric(l.receivedQty),
    acceptedQty: toNumeric(l.acceptedQty),
    rejectedQty: toNumeric(l.rejectedQty),
    cancelledQty: toNumeric(l.cancelledQty),
    remainingQty: toNumeric(l.remainingQty),
    createdAt: toRequiredIsoString(l.createdAt),
    updatedAt: toRequiredIsoString(l.updatedAt),
  };
}

export interface PurchaseOrderRevisionResponseDto {
  id: string;
  purchaseOrderId: string;
  revisionNumber: number;
  changeReason: string;
  snapshotData: any;
  amendedById: string | null;
  approvedById: string | null;
  createdAt: string;
}

export function toPurchaseOrderRevisionDto(r: any): PurchaseOrderRevisionResponseDto {
  return {
    id: r.id,
    purchaseOrderId: r.purchaseOrderId,
    revisionNumber: r.revisionNumber,
    changeReason: r.changeReason,
    snapshotData: r.snapshotData,
    amendedById: r.amendedById ?? null,
    approvedById: r.approvedById ?? null,
    createdAt: toRequiredIsoString(r.createdAt),
  };
}

// 7. Goods Receipt Note DTOs
export interface GoodsReceiptNoteResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber?: string;
  vendorId: string;
  vendorName?: string;
  storeId: string;
  storeName?: string;
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
  lines?: GrnLineResponseDto[];
}

export function toGoodsReceiptNoteDto(grn: any): GoodsReceiptNoteResponseDto {
  return {
    id: grn.id,
    organizationId: grn.organizationId,
    communityId: grn.communityId,
    grnNumber: grn.grnNumber,
    purchaseOrderId: grn.purchaseOrderId,
    poNumber: grn.purchaseOrder?.poNumber,
    vendorId: grn.vendorId,
    vendorName: grn.vendor?.displayName ?? grn.vendor?.legalName,
    storeId: grn.storeId,
    storeName: grn.store?.name,
    deliveryChallanNumber: grn.deliveryChallanNumber ?? null,
    vendorInvoiceReference: grn.vendorInvoiceReference ?? null,
    receivedAt: toRequiredIsoString(grn.receivedAt),
    receivedById: grn.receivedById ?? null,
    status: grn.status,
    inspectionStatus: grn.inspectionStatus,
    inspectedById: grn.inspectedById ?? null,
    inspectedAt: toSafeIsoString(grn.inspectedAt),
    inspectionComments: grn.inspectionComments ?? null,
    inspectionEvidenceDocumentId: grn.inspectionEvidenceDocumentId ?? null,
    postedAt: toSafeIsoString(grn.postedAt),
    inventoryReceiptId: grn.inventoryReceiptId ?? null,
    notes: grn.notes ?? null,
    documentId: grn.documentId ?? null,
    version: grn.version,
    createdAt: toRequiredIsoString(grn.createdAt),
    updatedAt: toRequiredIsoString(grn.updatedAt),
    lines: grn.lines ? grn.lines.map(toGrnLineDto) : undefined,
  };
}

export interface GrnLineResponseDto {
  id: string;
  grnId: string;
  poLineId: string;
  lineNumber: number;
  deliveredQty: number;
  acceptedQty: number;
  rejectedQty: number;
  damagedQty: number;
  uomId: string | null;
  uomName?: string | null;
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

export function toGrnLineDto(l: any): GrnLineResponseDto {
  return {
    id: l.id,
    grnId: l.grnId,
    poLineId: l.poLineId,
    lineNumber: l.lineNumber,
    deliveredQty: toNumeric(l.deliveredQty),
    acceptedQty: toNumeric(l.acceptedQty),
    rejectedQty: toNumeric(l.rejectedQty),
    damagedQty: toNumeric(l.damagedQty),
    uomId: l.uomId ?? null,
    uomName: l.uom?.name ?? null,
    binId: l.binId ?? null,
    batchNumber: l.batchNumber ?? null,
    expiryDate: toSafeIsoString(l.expiryDate),
    serialNumbers: l.serialNumbers ?? [],
    rejectionReason: l.rejectionReason ?? null,
    rejectionDisposition: l.rejectionDisposition ?? null,
    notes: l.notes ?? null,
    createdAt: toRequiredIsoString(l.createdAt),
    updatedAt: toRequiredIsoString(l.updatedAt),
  };
}

// 8. Service Receipt Note DTOs
export interface ServiceReceiptNoteResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  serviceReceiptNumber: string;
  purchaseOrderId: string;
  poNumber?: string;
  vendorId: string;
  vendorName?: string;
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
  lines?: ServiceReceiptLineResponseDto[];
}

export function toServiceReceiptNoteDto(srn: any): ServiceReceiptNoteResponseDto {
  return {
    id: srn.id,
    organizationId: srn.organizationId,
    communityId: srn.communityId,
    serviceReceiptNumber: srn.serviceReceiptNumber,
    purchaseOrderId: srn.purchaseOrderId,
    poNumber: srn.purchaseOrder?.poNumber,
    vendorId: srn.vendorId,
    vendorName: srn.vendor?.displayName ?? srn.vendor?.legalName,
    serviceStartDate: toSafeIsoString(srn.serviceStartDate),
    serviceEndDate: toSafeIsoString(srn.serviceEndDate),
    status: srn.status,
    verifiedById: srn.verifiedById ?? null,
    acceptedById: srn.acceptedById ?? null,
    acceptedAt: toSafeIsoString(srn.acceptedAt),
    notes: srn.notes ?? null,
    documentId: srn.documentId ?? null,
    version: srn.version,
    createdAt: toRequiredIsoString(srn.createdAt),
    updatedAt: toRequiredIsoString(srn.updatedAt),
    lines: srn.lines ? srn.lines.map(toServiceReceiptLineDto) : undefined,
  };
}

export interface ServiceReceiptLineResponseDto {
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

export function toServiceReceiptLineDto(l: any): ServiceReceiptLineResponseDto {
  return {
    id: l.id,
    serviceReceiptId: l.serviceReceiptId,
    poLineId: l.poLineId,
    description: l.description,
    deliveredQty: toNumeric(l.deliveredQty),
    acceptedQty: toNumeric(l.acceptedQty),
    uomName: l.uomName ?? null,
    notes: l.notes ?? null,
    createdAt: toRequiredIsoString(l.createdAt),
    updatedAt: toRequiredIsoString(l.updatedAt),
  };
}

// 9. Vendor Performance & Rating DTOs
export interface VendorPerformanceMetricResponseDto {
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

export function toVendorPerformanceMetricDto(m: any): VendorPerformanceMetricResponseDto {
  return {
    id: m.id,
    vendorId: m.vendorId,
    periodStart: toRequiredIsoString(m.periodStart),
    periodEnd: toRequiredIsoString(m.periodEnd),
    totalPurchaseOrders: m.totalPurchaseOrders,
    completedPurchaseOrders: m.completedPurchaseOrders,
    onTimeDeliveryRate: toNumeric(m.onTimeDeliveryRate),
    qualityAcceptanceRate: toNumeric(m.qualityAcceptanceRate),
    fulfillmentRate: toNumeric(m.fulfillmentRate),
    quotationResponseRate: toNumeric(m.quotationResponseRate),
    calculatedScore: toNumeric(m.calculatedScore),
    createdAt: toRequiredIsoString(m.createdAt),
    updatedAt: toRequiredIsoString(m.updatedAt),
  };
}

export interface VendorRatingResponseDto {
  id: string;
  vendorId: string;
  purchaseOrderId: string | null;
  ratedById: string | null;
  ratingCategory: VendorRatingCategory;
  score: number;
  reviewComments: string | null;
  createdAt: string;
}

export function toVendorRatingDto(r: any): VendorRatingResponseDto {
  return {
    id: r.id,
    vendorId: r.vendorId,
    purchaseOrderId: r.purchaseOrderId ?? null,
    ratedById: r.ratedById ?? null,
    ratingCategory: r.ratingCategory,
    score: r.score,
    reviewComments: r.reviewComments ?? null,
    createdAt: toRequiredIsoString(r.createdAt),
  };
}
