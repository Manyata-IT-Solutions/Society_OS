import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { MatchingStatus, MatchExceptionType } from '@prisma/client';

export interface MatchingResult {
  matchingStatus: MatchingStatus;
  exceptions: Array<{
    lineId?: string;
    exceptionType: MatchExceptionType;
    expectedValue: string;
    actualValue: string;
    varianceValue: number;
    toleranceAllowed: number;
    severity: string;
    reason: string;
  }>;
  summary: {
    matchType: '2_WAY' | '3_WAY' | 'SERVICE' | 'NON_PO';
    orderedQty: number;
    acceptedQty: number;
    previouslyInvoicedQty: number;
    currentInvoiceQty: number;
    poUnitPrice: number;
    invoiceUnitPrice: number;
    totalVariance: number;
  };
}

@Injectable()
export class InvoiceMatchingEngine {
  constructor(private readonly prisma: PrismaService) {}

  async matchInvoice(supplierInvoiceId: string): Promise<MatchingResult> {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: supplierInvoiceId },
      include: {
        lines: true,
        purchaseOrder: {
          include: {
            lines: true,
            goodsReceiptNotes: {
              where: { status: 'POSTED' },
              include: { lines: true },
            },
            serviceReceipts: {
              where: { status: 'ACCEPTED' },
              include: { lines: true },
            },
          },
        },
      },
    });

    if (!invoice) throw new Error('Supplier invoice not found');

    // If NON_PO invoice or no PO, matching is NOT_REQUIRED
    if (
      invoice.invoiceType === 'NON_PO_EXPENSE' ||
      !invoice.purchaseOrderId ||
      !invoice.purchaseOrder
    ) {
      return {
        matchingStatus: 'NOT_REQUIRED',
        exceptions: [],
        summary: {
          matchType: 'NON_PO',
          orderedQty: 0,
          acceptedQty: 0,
          previouslyInvoicedQty: 0,
          currentInvoiceQty: invoice.lines.reduce((sum, l) => sum + Number(l.quantity), 0),
          poUnitPrice: 0,
          invoiceUnitPrice: 0,
          totalVariance: 0,
        },
      };
    }

    const po = invoice.purchaseOrder;
    const isService = invoice.invoiceType === 'PO_SERVICE' || po.poType === 'SERVICE';
    const matchType = isService ? 'SERVICE' : '3_WAY';

    // Fetch active tolerance policy
    const policy = await this.prisma.matchingTolerancePolicy.findFirst({
      where: { organizationId: invoice.organizationId },
    });

    const priceTolPercent = policy ? Number(policy.priceTolerancePercent) : 0;
    const _qtyTolPercent = policy ? Number(policy.qtyTolerancePercent) : 0;

    const exceptions: MatchingResult['exceptions'] = [];
    let totalOrdered = 0;
    let totalAccepted = 0;
    let totalPrevInvoiced = 0;
    let totalCurrentInvoiced = 0;
    const totalVariance = 0;

    // Vendor match check
    if (invoice.vendorId !== po.vendorId) {
      exceptions.push({
        exceptionType: 'VENDOR_MISMATCH',
        expectedValue: po.vendorId,
        actualValue: invoice.vendorId,
        varianceValue: 0,
        toleranceAllowed: 0,
        severity: 'CRITICAL',
        reason: 'Invoice vendor does not match Purchase Order vendor',
      });
    }

    // Currency match check
    if (invoice.currency !== po.currency) {
      exceptions.push({
        exceptionType: 'CURRENCY_MISMATCH',
        expectedValue: po.currency,
        actualValue: invoice.currency,
        varianceValue: 0,
        toleranceAllowed: 0,
        severity: 'CRITICAL',
        reason: 'Invoice currency does not match Purchase Order currency',
      });
    }

    // Line by line evaluation
    for (const invLine of invoice.lines) {
      const invQty = Number(invLine.quantity);
      const invPrice = Number(invLine.unitPrice);
      totalCurrentInvoiced += invQty;

      if (!invLine.poLineId) {
        continue;
      }

      const poLine = po.lines.find((l) => l.id === invLine.poLineId);
      if (!poLine) {
        exceptions.push({
          lineId: invLine.id,
          exceptionType: 'OTHER',
          expectedValue: 'Valid PO Line',
          actualValue: 'Line not found',
          varianceValue: 0,
          toleranceAllowed: 0,
          severity: 'CRITICAL',
          reason: 'PO line referenced by invoice does not exist',
        });
        continue;
      }

      const poQty = Number(poLine.orderedQty);
      const poPrice = Number(poLine.unitPrice);
      totalOrdered += poQty;

      // Prior invoices for this poLine
      const priorInvoicedLines = await this.prisma.supplierInvoiceLine.findMany({
        where: {
          poLineId: poLine.id,
          supplierInvoice: {
            id: { not: invoice.id },
            status: { notIn: ['CANCELLED', 'REVERSED'] },
          },
        },
      });
      const prevInvoicedQty = priorInvoicedLines.reduce((sum, l) => sum + Number(l.quantity), 0);
      totalPrevInvoiced += prevInvoicedQty;

      // Price comparison
      const priceVariance = invPrice - poPrice;
      const priceVariancePercent = poPrice > 0 ? (priceVariance / poPrice) * 100 : 0;
      if (priceVariance > 0.001 && priceVariancePercent > priceTolPercent + 0.001) {
        exceptions.push({
          lineId: invLine.id,
          exceptionType: 'PRICE_VARIANCE',
          expectedValue: String(poPrice),
          actualValue: String(invPrice),
          varianceValue: priceVariance,
          toleranceAllowed: priceTolPercent,
          severity: 'CRITICAL',
          reason: `Unit price ₹${invPrice} exceeds PO price ₹${poPrice} by ${priceVariancePercent.toFixed(2)}%`,
        });
      }

      // Quantity comparison (GRN vs Service Acceptance vs PO)
      if (isService) {
        // Find accepted service receipts
        let serviceAcceptedQty = 0;
        for (const sr of po.serviceReceipts) {
          for (const srl of sr.lines) {
            if (srl.poLineId === poLine.id) {
              serviceAcceptedQty += Number(srl.acceptedQty);
            }
          }
        }
        totalAccepted += serviceAcceptedQty;

        if (serviceAcceptedQty <= 0) {
          exceptions.push({
            lineId: invLine.id,
            exceptionType: 'MISSING_SERVICE_ACCEPTANCE',
            expectedValue: `Accepted Service >= ${invQty}`,
            actualValue: '0',
            varianceValue: invQty,
            toleranceAllowed: 0,
            severity: 'CRITICAL',
            reason: 'No accepted Service Receipt Note found for this service line',
          });
        } else if (prevInvoicedQty + invQty > serviceAcceptedQty + 0.001) {
          const overQty = prevInvoicedQty + invQty - serviceAcceptedQty;
          exceptions.push({
            lineId: invLine.id,
            exceptionType: 'OVER_INVOICE',
            expectedValue: String(serviceAcceptedQty - prevInvoicedQty),
            actualValue: String(invQty),
            varianceValue: overQty,
            toleranceAllowed: 0,
            severity: 'CRITICAL',
            reason: `Total billed quantity (${prevInvoicedQty + invQty}) exceeds accepted service quantity (${serviceAcceptedQty})`,
          });
        }
      } else {
        // Goods 3-Way matching with GRNs
        let goodsAcceptedQty = 0;
        let _goodsRejectedQty = 0;
        for (const grn of po.goodsReceiptNotes) {
          for (const grnl of grn.lines) {
            if (grnl.poLineId === poLine.id) {
              goodsAcceptedQty += Number(grnl.acceptedQty);
              _goodsRejectedQty += Number(grnl.rejectedQty);
            }
          }
        }
        totalAccepted += goodsAcceptedQty;

        if (goodsAcceptedQty <= 0) {
          exceptions.push({
            lineId: invLine.id,
            exceptionType: 'MISSING_GRN',
            expectedValue: `Accepted GRN >= ${invQty}`,
            actualValue: '0',
            varianceValue: invQty,
            toleranceAllowed: 0,
            severity: 'CRITICAL',
            reason: 'No posted Goods Receipt Note found for this item',
          });
        } else if (prevInvoicedQty + invQty > goodsAcceptedQty + 0.001) {
          const overQty = prevInvoicedQty + invQty - goodsAcceptedQty;
          exceptions.push({
            lineId: invLine.id,
            exceptionType: 'OVER_INVOICE',
            expectedValue: String(goodsAcceptedQty - prevInvoicedQty),
            actualValue: String(invQty),
            varianceValue: overQty,
            toleranceAllowed: 0,
            severity: 'CRITICAL',
            reason: `Total invoiced quantity (${prevInvoicedQty + invQty}) exceeds accepted goods receipt (${goodsAcceptedQty})`,
          });
        }
      }
    }

    let matchingStatus: MatchingStatus = 'MATCHED';
    if (exceptions.length > 0) {
      matchingStatus = 'EXCEPTION';
    }

    return {
      matchingStatus,
      exceptions,
      summary: {
        matchType,
        orderedQty: totalOrdered,
        acceptedQty: totalAccepted,
        previouslyInvoicedQty: totalPrevInvoiced,
        currentInvoiceQty: totalCurrentInvoiced,
        poUnitPrice: 0,
        invoiceUnitPrice: 0,
        totalVariance,
      },
    };
  }
}
