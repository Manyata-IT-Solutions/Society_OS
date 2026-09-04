import { z } from 'zod';

// Vendor Validations
export const CreateVendorSchema = z.object({
  organizationId: z.string().uuid(),
  vendorCode: z.string().min(1).max(50).optional(),
  legalName: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  vendorType: z
    .enum([
      'SUPPLIER',
      'SERVICE_PROVIDER',
      'CONTRACTOR',
      'CONSULTANT',
      'AMC_PROVIDER',
      'UTILITY_PROVIDER',
      'OTHER',
    ])
    .default('SUPPLIER'),
  countryCode: z.string().max(10).default('IND'),
  primaryEmail: z.string().email().optional().nullable(),
  primaryPhone: z.string().max(50).optional().nullable(),
  website: z.string().url().optional().nullable(),
  paymentTerms: z.string().max(255).optional().nullable(),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  isPreferred: z.boolean().default(false),
  communityIds: z.array(z.string().uuid()).optional(),
  capabilities: z
    .array(
      z.object({
        inventoryCategoryId: z.string().uuid().optional().nullable(),
        serviceCategoryKey: z.string().max(100).optional().nullable(),
        description: z.string().optional().nullable(),
      }),
    )
    .optional(),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        designation: z.string().max(100).optional().nullable(),
        email: z.string().email().optional().nullable(),
        phone: z.string().max(50).optional().nullable(),
        contactType: z
          .enum(['SALES', 'SERVICE', 'ACCOUNTS', 'ESCALATION', 'TECHNICAL', 'MANAGEMENT', 'OTHER'])
          .default('SALES'),
        isPrimary: z.boolean().default(false),
      }),
    )
    .optional(),
  addresses: z
    .array(
      z.object({
        addressType: z
          .enum(['REGISTERED', 'BILLING', 'SHIPPING', 'BRANCH', 'SERVICE_CENTER'])
          .default('REGISTERED'),
        addressLine1: z.string().min(1).max(255),
        addressLine2: z.string().max(255).optional().nullable(),
        city: z.string().min(1).max(100),
        state: z.string().min(1).max(100),
        postalCode: z.string().min(1).max(20),
        countryCode: z.string().max(10).default('IND'),
        isPrimary: z.boolean().default(false),
      }),
    )
    .optional(),
  taxRegistrations: z
    .array(
      z.object({
        countryCode: z.string().max(10).default('IND'),
        registrationType: z.enum(['GSTIN', 'PAN', 'MSME', 'VAT', 'EIN', 'CUSTOM']).default('GSTIN'),
        registrationNumber: z.string().min(1).max(100),
        validFrom: z.string().datetime().optional().nullable(),
        validTo: z.string().datetime().optional().nullable(),
      }),
    )
    .optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial().omit({ organizationId: true });

export const VendorStatusActionSchema = z.object({
  reason: z.string().min(1).max(1000),
});

// Requisition Validations
export const CreatePurchaseRequisitionSchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  requestType: z.enum(['GOODS', 'SERVICE', 'MIXED']).default('GOODS'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  requestingDepartment: z.string().max(100).optional().nullable(),
  requiredByDate: z.string().datetime().optional().nullable(),
  targetStoreId: z.string().uuid().optional().nullable(),
  sourceType: z
    .enum([
      'MANUAL',
      'INVENTORY_REORDER',
      'WORK_ORDER_MATERIAL_SHORTAGE',
      'MAINTENANCE_PLAN',
      'ASSET_REQUIREMENT',
      'OTHER',
    ])
    .default('MANUAL'),
  sourceReferenceId: z.string().max(100).optional().nullable(),
  currency: z.string().max(10).default('INR'),
  justification: z.string().max(2000).optional().nullable(),
  lines: z
    .array(
      z.object({
        lineType: z.enum(['CATALOG_ITEM', 'NON_CATALOG_ITEM', 'SERVICE']).default('CATALOG_ITEM'),
        inventoryItemId: z.string().uuid().optional().nullable(),
        serviceCategoryKey: z.string().max(100).optional().nullable(),
        description: z.string().min(1).max(1000),
        specification: z.string().max(2000).optional().nullable(),
        quantity: z.number().positive(),
        uomId: z.string().uuid().optional().nullable(),
        uomName: z.string().max(50).optional().nullable(),
        estimatedUnitPrice: z.number().nonnegative().optional().nullable(),
        requiredByDate: z.string().datetime().optional().nullable(),
        targetStoreId: z.string().uuid().optional().nullable(),
        linkedWorkOrderId: z.string().uuid().optional().nullable(),
        linkedWorkOrderMaterialRequirementId: z.string().uuid().optional().nullable(),
        linkedAssetId: z.string().uuid().optional().nullable(),
      }),
    )
    .min(1),
});

// RFQ Validations
export const CreateRfqSchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  currency: z.string().max(10).default('INR'),
  submissionDeadline: z.string().datetime(),
  commercialTerms: z.string().max(2000).optional().nullable(),
  deliveryTerms: z.string().max(2000).optional().nullable(),
  deliveryLocation: z.string().max(255).optional().nullable(),
  deliveryRequiredBy: z.string().datetime().optional().nullable(),
  isSingleSourceAllowed: z.boolean().default(false),
  singleSourceJustification: z.string().max(1000).optional().nullable(),
  isEmergency: z.boolean().default(false),
  emergencyJustification: z.string().max(1000).optional().nullable(),
  minimumQuotationsRequired: z.number().int().min(1).default(3),
  isSealedBid: z.boolean().default(false),
  vendorIds: z.array(z.string().uuid()).min(1),
  lines: z
    .array(
      z.object({
        sourcePrLineId: z.string().uuid().optional().nullable(),
        lineType: z.enum(['CATALOG_ITEM', 'NON_CATALOG_ITEM', 'SERVICE']).default('CATALOG_ITEM'),
        inventoryItemId: z.string().uuid().optional().nullable(),
        description: z.string().min(1).max(1000),
        specification: z.string().max(2000).optional().nullable(),
        quantity: z.number().positive(),
        uomId: z.string().uuid().optional().nullable(),
        uomName: z.string().max(50).optional().nullable(),
        targetDeliveryDate: z.string().datetime().optional().nullable(),
        deliveryLocation: z.string().max(255).optional().nullable(),
        technicalRequirements: z.string().max(2000).optional().nullable(),
      }),
    )
    .min(1),
});

export const ExtendRfqDeadlineSchema = z.object({
  newDeadline: z.string().datetime(),
  reason: z.string().min(1).max(1000),
});

// Quotation Validations
export const RecordVendorQuotationSchema = z.object({
  rfqId: z.string().uuid(),
  vendorId: z.string().uuid(),
  vendorReferenceNumber: z.string().max(100).optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  currency: z.string().max(10).default('INR'),
  deliveryLeadTimeDays: z.number().int().nonnegative().optional().nullable(),
  paymentTerms: z.string().max(255).optional().nullable(),
  warrantyTerms: z.string().max(255).optional().nullable(),
  evaluationNotes: z.string().max(2000).optional().nullable(),
  documentId: z.string().uuid().optional().nullable(),
  isLateSubmission: z.boolean().default(false),
  lateSubmissionReason: z.string().max(1000).optional().nullable(),
  lines: z
    .array(
      z.object({
        rfqLineId: z.string().uuid(),
        description: z.string().min(1).max(1000),
        offeredQuantity: z.number().positive(),
        uomId: z.string().uuid().optional().nullable(),
        uomName: z.string().max(50).optional().nullable(),
        unitPrice: z.number().nonnegative(),
        discountAmount: z.number().nonnegative().default(0),
        taxRate: z.number().nonnegative().default(0),
        taxAmount: z.number().nonnegative().default(0),
        freightAmount: z.number().nonnegative().default(0),
        otherChargesAmount: z.number().nonnegative().default(0),
        deliveryLeadTimeDays: z.number().int().nonnegative().optional().nullable(),
        brandName: z.string().max(100).optional().nullable(),
        modelNumber: z.string().max(100).optional().nullable(),
        offeredSpecification: z.string().max(2000).optional().nullable(),
        isAlternateOffer: z.boolean().default(false),
      }),
    )
    .min(1),
});

export const TechnicalEvaluationSchema = z.object({
  lines: z.array(
    z.object({
      quotationLineId: z.string().uuid(),
      technicalCompliance: z.enum([
        'COMPLIANT',
        'PARTIALLY_COMPLIANT',
        'NON_COMPLIANT',
        'NOT_EVALUATED',
      ]),
      complianceNotes: z.string().max(1000).optional().nullable(),
    }),
  ),
  technicalComplianceScore: z.number().min(0).max(100).optional().nullable(),
  evaluationNotes: z.string().max(2000).optional().nullable(),
});

// Sourcing Award Validations
export const CreateSourcingAwardSchema = z.object({
  rfqId: z.string().uuid(),
  selectedVendorId: z.string().uuid().optional().nullable(),
  isSplitAward: z.boolean().default(false),
  isSingleSource: z.boolean().default(false),
  isLowestPriceSelected: z.boolean().default(true),
  recommendationReason: z.string().min(1).max(2000),
  decisionNotes: z.string().max(2000).optional().nullable(),
  lines: z
    .array(
      z.object({
        rfqLineId: z.string().uuid(),
        quotationId: z.string().uuid(),
        quotationLineId: z.string().uuid(),
        vendorId: z.string().uuid(),
        awardedQuantity: z.number().positive(),
        uomId: z.string().uuid().optional().nullable(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1),
});

// Purchase Order Validations
export const CreatePurchaseOrderSchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid(),
  vendorId: z.string().uuid(),
  sourceAwardId: z.string().uuid().optional().nullable(),
  currency: z.string().max(10).default('INR'),
  poType: z.enum(['GOODS', 'SERVICE', 'MIXED']).default('GOODS'),
  orderDate: z.string().datetime().optional(),
  deliveryRequiredBy: z.string().datetime().optional().nullable(),
  deliveryAddress: z.string().max(500).optional().nullable(),
  billingAddress: z.string().max(500).optional().nullable(),
  paymentTerms: z.string().max(255).optional().nullable(),
  deliveryTerms: z.string().max(255).optional().nullable(),
  warrantyTerms: z.string().max(255).optional().nullable(),
  termsAndConditions: z.string().max(5000).optional().nullable(),
  lines: z
    .array(
      z.object({
        sourcePrLineId: z.string().uuid().optional().nullable(),
        sourceRfqLineId: z.string().uuid().optional().nullable(),
        sourceQuotationLineId: z.string().uuid().optional().nullable(),
        lineType: z.enum(['CATALOG_ITEM', 'NON_CATALOG_ITEM', 'SERVICE']).default('CATALOG_ITEM'),
        inventoryItemId: z.string().uuid().optional().nullable(),
        serviceCategoryKey: z.string().max(100).optional().nullable(),
        description: z.string().min(1).max(1000),
        specificationSnapshot: z.string().max(2000).optional().nullable(),
        orderedQty: z.number().positive(),
        uomId: z.string().uuid().optional().nullable(),
        uomName: z.string().max(50).optional().nullable(),
        unitPrice: z.number().nonnegative(),
        discountAmount: z.number().nonnegative().default(0),
        taxAmount: z.number().nonnegative().default(0),
        targetStoreId: z.string().uuid().optional().nullable(),
        linkedWorkOrderId: z.string().uuid().optional().nullable(),
        linkedWorkOrderMaterialRequirementId: z.string().uuid().optional().nullable(),
        linkedAssetId: z.string().uuid().optional().nullable(),
      }),
    )
    .min(1),
});

export const AmendPurchaseOrderSchema = z.object({
  changeReason: z.string().min(1).max(1000),
  lines: z.array(
    z.object({
      id: z.string().uuid().optional(),
      description: z.string().min(1).max(1000),
      orderedQty: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      discountAmount: z.number().nonnegative().default(0),
      taxAmount: z.number().nonnegative().default(0),
      uomId: z.string().uuid().optional().nullable(),
    }),
  ),
  paymentTerms: z.string().max(255).optional().nullable(),
  deliveryTerms: z.string().max(255).optional().nullable(),
  deliveryRequiredBy: z.string().datetime().optional().nullable(),
});

export const AcknowledgePurchaseOrderSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'ACCEPTED', 'REJECTED', 'CHANGE_REQUESTED']),
  notes: z.string().max(1000).optional().nullable(),
});

export const ShortClosePurchaseOrderSchema = z.object({
  reason: z.string().min(1).max(1000),
});

// GRN Validations
export const CreateGoodsReceiptNoteSchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  storeId: z.string().uuid(),
  deliveryChallanNumber: z.string().max(100).optional().nullable(),
  vendorInvoiceReference: z.string().max(100).optional().nullable(),
  receivedAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional().nullable(),
  lines: z
    .array(
      z.object({
        poLineId: z.string().uuid(),
        deliveredQty: z.number().positive(),
        acceptedQty: z.number().nonnegative().default(0),
        rejectedQty: z.number().nonnegative().default(0),
        damagedQty: z.number().nonnegative().default(0),
        uomId: z.string().uuid().optional().nullable(),
        binId: z.string().uuid().optional().nullable(),
        batchNumber: z.string().max(100).optional().nullable(),
        expiryDate: z.string().datetime().optional().nullable(),
        serialNumbers: z.array(z.string()).default([]),
        rejectionReason: z.string().max(500).optional().nullable(),
        rejectionDisposition: z
          .enum(['RETURN_TO_VENDOR', 'REPLACEMENT_EXPECTED', 'SCRAP', 'OTHER'])
          .optional()
          .nullable(),
        notes: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1),
});

export const RecordGrnInspectionSchema = z.object({
  inspectionStatus: z.enum(['PASSED', 'FAILED', 'CONDITIONALLY_PASSED']),
  comments: z.string().max(1000).optional().nullable(),
  lines: z.array(
    z.object({
      grnLineId: z.string().uuid(),
      acceptedQty: z.number().nonnegative(),
      rejectedQty: z.number().nonnegative(),
      damagedQty: z.number().nonnegative().default(0),
      rejectionReason: z.string().max(500).optional().nullable(),
      rejectionDisposition: z
        .enum(['RETURN_TO_VENDOR', 'REPLACEMENT_EXPECTED', 'SCRAP', 'OTHER'])
        .optional()
        .nullable(),
    }),
  ),
});

// Service Receipt Validations
export const CreateServiceReceiptNoteSchema = z.object({
  organizationId: z.string().uuid(),
  communityId: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  serviceStartDate: z.string().datetime().optional().nullable(),
  serviceEndDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  lines: z
    .array(
      z.object({
        poLineId: z.string().uuid(),
        description: z.string().min(1).max(1000),
        deliveredQty: z.number().positive(),
        acceptedQty: z.number().nonnegative(),
        uomName: z.string().max(50).optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1),
});

// Vendor Rating Validation
export const CreateVendorRatingSchema = z.object({
  vendorId: z.string().uuid(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  ratingCategory: z
    .enum(['QUALITY', 'DELIVERY_PUNCTUALITY', 'COMMUNICATION', 'SERVICE_EXCELLENCE', 'OVERALL'])
    .default('OVERALL'),
  score: z.number().int().min(1).max(5),
  reviewComments: z.string().max(1000).optional().nullable(),
});
