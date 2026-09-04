import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { VendorQuotationRepository } from './vendor-quotation.repository.js';
import { QuotationComparisonService } from './quotation-comparison.service.js';
import { ProcurementSequenceService } from './sequence.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, VendorQuotation } from '@community-os/types';

@Injectable()
export class VendorQuotationService {
  constructor(
    private readonly quoteRepo: VendorQuotationRepository,
    private readonly comparisonService: QuotationComparisonService,
    private readonly sequenceService: ProcurementSequenceService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async recordQuotation(
    data: {
      rfqId: string;
      vendorId: string;
      vendorReferenceNumber?: string | null;
      validUntil?: string | null;
      currency?: string;
      deliveryLeadTimeDays?: number | null;
      paymentTerms?: string | null;
      warrantyTerms?: string | null;
      evaluationNotes?: string | null;
      documentId?: string | null;
      isLateSubmission?: boolean;
      lateSubmissionReason?: string | null;
      lines: Array<{
        rfqLineId: string;
        description: string;
        offeredQuantity: number;
        uomId?: string | null;
        uomName?: string | null;
        unitPrice: number;
        discountAmount?: number;
        taxRate?: number;
        taxAmount?: number;
        freightAmount?: number;
        otherChargesAmount?: number;
        deliveryLeadTimeDays?: number | null;
        brandName?: string | null;
        modelNumber?: string | null;
        offeredSpecification?: string | null;
        isAlternateOffer?: boolean;
      }>;
    },
    actor: Actor,
  ): Promise<VendorQuotation> {
    const rfq = await this.prisma.requestForQuotation.findUnique({
      where: { id: data.rfqId },
      include: { invitations: true },
    });

    if (!rfq) throw new NotFoundException('RFQ not found');

    const now = new Date();
    const isLate = now > new Date(rfq.submissionDeadline);
    if (isLate && !data.isLateSubmission && !data.lateSubmissionReason) {
      throw new BadRequestException(
        'Submission deadline has passed. A justification is required to accept late bids.',
      );
    }

    // Check existing revisions
    const existingQuotes = await this.prisma.vendorQuotation.findMany({
      where: { rfqId: data.rfqId, vendorId: data.vendorId },
      orderBy: { revision: 'desc' },
    });

    const revision =
      existingQuotes.length > 0 && existingQuotes[0] ? existingQuotes[0].revision + 1 : 1;

    // Set prior revisions isCurrentRevision = false
    if (existingQuotes.length > 0) {
      await this.prisma.vendorQuotation.updateMany({
        where: { rfqId: data.rfqId, vendorId: data.vendorId },
        data: { isCurrentRevision: false },
      });
    }

    const quotationNumber = `QT-${rfq.rfqNumber.replace('RFQ-', '')}-${revision}`;

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let freightTotal = 0;
    let otherCharges = 0;

    const linesCreate = data.lines.map((l, idx) => {
      const lineSubtotal = l.offeredQuantity * l.unitPrice;
      const lineDisc = l.discountAmount ?? 0;
      const lineTax = l.taxAmount ?? (lineSubtotal - lineDisc) * ((l.taxRate ?? 0) / 100);
      const lineFreight = l.freightAmount ?? 0;
      const lineOther = l.otherChargesAmount ?? 0;
      const lineTotal = lineSubtotal - lineDisc + lineTax + lineFreight + lineOther;

      subtotal += lineSubtotal;
      discountTotal += lineDisc;
      taxTotal += lineTax;
      freightTotal += lineFreight;
      otherCharges += lineOther;

      return {
        lineNumber: idx + 1,
        rfqLineId: l.rfqLineId,
        description: l.description,
        offeredQuantity: l.offeredQuantity,
        uomId: l.uomId ?? null,
        uomName: l.uomName ?? null,
        unitPrice: l.unitPrice,
        discountAmount: lineDisc,
        taxRate: l.taxRate ?? 0,
        taxAmount: lineTax,
        freightAmount: lineFreight,
        otherChargesAmount: lineOther,
        lineTotal,
        deliveryLeadTimeDays: l.deliveryLeadTimeDays ?? data.deliveryLeadTimeDays ?? null,
        brandName: l.brandName ?? null,
        modelNumber: l.modelNumber ?? null,
        offeredSpecification: l.offeredSpecification ?? null,
        isAlternateOffer: Boolean(l.isAlternateOffer),
        technicalCompliance: 'NOT_EVALUATED' as any,
      };
    });

    const grandTotal = subtotal - discountTotal + taxTotal + freightTotal + otherCharges;

    const quotation = await this.quoteRepo.create({
      rfq: { connect: { id: data.rfqId } },
      vendor: { connect: { id: data.vendorId } },
      quotationNumber,
      vendorReferenceNumber: data.vendorReferenceNumber ?? null,
      revision,
      isCurrentRevision: true,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      currency: data.currency ?? rfq.currency,
      status: 'SUBMITTED',
      isLateSubmission: isLate,
      lateSubmissionReason: data.lateSubmissionReason ?? null,
      subtotal,
      discountTotal,
      taxTotal,
      freightTotal,
      otherCharges,
      grandTotal,
      deliveryLeadTimeDays: data.deliveryLeadTimeDays ?? null,
      paymentTerms: data.paymentTerms ?? null,
      warrantyTerms: data.warrantyTerms ?? null,
      evaluationNotes: data.evaluationNotes ?? null,
      document: data.documentId ? { connect: { id: data.documentId } } : undefined,
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      lines: { create: linesCreate },
    } as any);

    // Mark vendor invitation responded
    await this.prisma.rfqVendorInvitation.updateMany({
      where: { rfqId: data.rfqId, vendorId: data.vendorId },
      data: { status: 'RESPONDED', respondedAt: new Date() },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).QUOTATION_SUBMITTED ?? 'quotation.submitted.v1',
        {
          rfqId: data.rfqId,
          vendorId: data.vendorId,
          grandTotal,
        },
        {
          organizationId: rfq.organizationId,
          communityId: rfq.communityId,
          userId: actor?.id,
        },
      ),
    );

    return quotation as unknown as VendorQuotation;
  }

  async evaluateTechnicalCompliance(
    quotationId: string,
    data: {
      lines: Array<{
        quotationLineId: string;
        technicalCompliance: any;
        complianceNotes?: string | null;
      }>;
      technicalComplianceScore?: number | null;
      evaluationNotes?: string | null;
    },
    _actor: Actor,
  ) {
    const quote = await this.quoteRepo.findById(quotationId);
    if (!quote) throw new NotFoundException('Quotation not found');

    for (const l of data.lines) {
      await this.prisma.vendorQuotationLine.update({
        where: { id: l.quotationLineId },
        data: {
          technicalCompliance: l.technicalCompliance,
          complianceNotes: l.complianceNotes ?? null,
        },
      });
    }

    const updated = await this.quoteRepo.update(quotationId, {
      technicalComplianceScore: data.technicalComplianceScore ?? null,
      evaluationNotes: data.evaluationNotes ?? quote.evaluationNotes,
      status: 'UNDER_EVALUATION',
    });

    return updated;
  }

  async getQuotation(id: string) {
    const q = await this.quoteRepo.findById(id);
    if (!q) throw new NotFoundException('Quotation not found');
    return q;
  }

  async listQuotationsByRfq(rfqId: string) {
    return this.quoteRepo.findByRfq(rfqId);
  }

  async getComparisonMatrix(rfqId: string) {
    return this.comparisonService.generateComparisonMatrix(rfqId);
  }
}
