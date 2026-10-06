import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { QuotationComparisonMatrix } from '@community-os/types';

@Injectable()
export class QuotationComparisonService {
  constructor(private readonly prisma: PrismaService) {}

  async generateComparisonMatrix(rfqId: string): Promise<QuotationComparisonMatrix> {
    const rfq = await this.prisma.requestForQuotation.findUnique({
      where: { id: rfqId },
      include: {
        lines: { include: { uom: true } },
        quotations: {
          where: { isCurrentRevision: true },
          include: {
            vendor: true,
            lines: { include: { uom: true } },
          },
        },
      },
    });

    if (!rfq) throw new NotFoundException('RFQ not found');

    const lowestGrandTotal =
      rfq.quotations.length > 0 ? Math.min(...rfq.quotations.map((q) => Number(q.grandTotal))) : 0;

    const linesMatrix = rfq.lines.map((rfqLine) => {
      // Find lowest price for this line across quotations
      const lineOffers = rfq.quotations
        .map((q) => {
          const qLine = q.lines.find((l) => l.rfqLineId === rfqLine.id);
          return {
            vendorId: q.vendorId,
            vendorName: q.vendor.displayName || q.vendor.legalName,
            quotationId: q.id,
            quotationLineId: qLine ? qLine.id : '',
            offeredQuantity: qLine ? Number(qLine.offeredQuantity) : 0,
            unitPrice: qLine ? Number(qLine.unitPrice) : 0,
            discountAmount: qLine ? Number(qLine.discountAmount) : 0,
            taxAmount: qLine ? Number(qLine.taxAmount) : 0,
            freightAmount: qLine ? Number(qLine.freightAmount) : 0,
            lineTotal: qLine ? Number(qLine.lineTotal) : 0,
            deliveryLeadTimeDays: qLine ? qLine.deliveryLeadTimeDays : null,
            brandName: qLine ? qLine.brandName : null,
            isAlternateOffer: qLine ? qLine.isAlternateOffer : false,
            technicalCompliance: qLine ? (qLine.technicalCompliance as any) : 'NOT_EVALUATED',
            score: q.totalScore ? Number(q.totalScore) : null,
          };
        })
        .filter((o) => o.quotationLineId !== '');

      const minLineTotal =
        lineOffers.length > 0 ? Math.min(...lineOffers.map((o) => o.lineTotal)) : 0;

      return {
        rfqLineId: rfqLine.id,
        description: rfqLine.description,
        requestedQuantity: Number(rfqLine.quantity),
        uomName: rfqLine.uom?.name ?? rfqLine.uomName ?? null,
        vendorQuotes: lineOffers.map((o) => ({
          ...o,
          isLowestPrice: o.lineTotal === minLineTotal,
        })),
      };
    });

    const summary = rfq.quotations
      .map((q) => {
        const gTotal = Number(q.grandTotal);
        const isLowest = gTotal === lowestGrandTotal;
        const allCompliant = q.lines.every((l) => l.technicalCompliance === 'COMPLIANT');

        return {
          vendorId: q.vendorId,
          vendorName: q.vendor.displayName || q.vendor.legalName,
          vendorCode: q.vendor.vendorCode,
          quotationId: q.id,
          subtotal: Number(q.subtotal),
          taxTotal: Number(q.taxTotal),
          freightTotal: Number(q.freightTotal),
          grandTotal: gTotal,
          technicalScore: q.technicalComplianceScore ? Number(q.technicalComplianceScore) : null,
          commercialScore: q.commercialScore ? Number(q.commercialScore) : null,
          totalScore: q.totalScore ? Number(q.totalScore) : null,
          isLowestCommercial: isLowest,
          isRecommended: isLowest && allCompliant,
          complianceStatus: allCompliant ? 'COMPLIANT' : 'PARTIALLY_OR_NON_COMPLIANT',
        };
      })
      .sort((a, b) => a.grandTotal - b.grandTotal);

    return {
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      title: rfq.title,
      currency: rfq.currency,
      submissionDeadline: rfq.submissionDeadline.toISOString(),
      isClosed: rfq.status === 'CLOSED' || rfq.status === 'EVALUATION' || rfq.status === 'AWARDED',
      minQuotesRequired: rfq.minimumQuotationsRequired,
      isSingleSource: rfq.isSingleSourceAllowed,
      lines: linesMatrix,
      summary,
    };
  }
}
