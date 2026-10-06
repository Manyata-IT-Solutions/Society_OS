import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class VendorPerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateVendorScorecard(vendorId: string, periodStart: Date, periodEnd: Date) {
    const [pos, grns, rfqInvitations] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: {
          vendorId,
          orderDate: { gte: periodStart, lte: periodEnd },
        },
        include: { lines: true },
      }),
      this.prisma.goodsReceiptNote.findMany({
        where: {
          vendorId,
          receivedAt: { gte: periodStart, lte: periodEnd },
          status: 'POSTED',
        },
        include: { lines: true, purchaseOrder: true },
      }),
      this.prisma.rfqVendorInvitation.findMany({
        where: {
          vendorId,
          invitedAt: { gte: periodStart, lte: periodEnd },
        },
      }),
    ]);

    const totalPurchaseOrders = pos.length;
    const completedPurchaseOrders = pos.filter(
      (p) => p.status === 'FULLY_RECEIVED' || p.status === 'CLOSED',
    ).length;

    // 1. On-Time Delivery Rate
    let onTimeCount = 0;
    let deliveredCount = 0;
    for (const grn of grns) {
      deliveredCount++;
      const reqDate = grn.purchaseOrder?.deliveryRequiredBy;
      if (!reqDate || new Date(grn.receivedAt) <= new Date(reqDate)) {
        onTimeCount++;
      }
    }
    const onTimeDeliveryRate = deliveredCount > 0 ? (onTimeCount / deliveredCount) * 100 : 100;

    // 2. Quality Acceptance Rate
    let totalDeliveredQty = 0;
    let totalAcceptedQty = 0;
    for (const grn of grns) {
      for (const line of grn.lines) {
        totalDeliveredQty += Number(line.deliveredQty);
        totalAcceptedQty += Number(line.acceptedQty);
      }
    }
    const qualityAcceptanceRate =
      totalDeliveredQty > 0 ? (totalAcceptedQty / totalDeliveredQty) * 100 : 100;

    // 3. Fulfillment Rate
    let totalOrderedQty = 0;
    for (const po of pos) {
      for (const line of po.lines) {
        totalOrderedQty += Number(line.orderedQty);
      }
    }
    const fulfillmentRate = totalOrderedQty > 0 ? (totalAcceptedQty / totalOrderedQty) * 100 : 100;

    // 4. Quotation Response Rate
    const totalInvited = rfqInvitations.length;
    const totalResponded = rfqInvitations.filter((i) => i.status === 'RESPONDED').length;
    const quotationResponseRate = totalInvited > 0 ? (totalResponded / totalInvited) * 100 : 100;

    // Weighted Score: 40% Quality + 30% On-Time + 20% Fulfillment + 10% Response
    const calculatedScore =
      qualityAcceptanceRate * 0.4 +
      onTimeDeliveryRate * 0.3 +
      fulfillmentRate * 0.2 +
      quotationResponseRate * 0.1;

    const metric = await this.prisma.vendorPerformanceMetric.upsert({
      where: {
        vendorId_periodStart_periodEnd: {
          vendorId,
          periodStart,
          periodEnd,
        },
      },
      update: {
        totalPurchaseOrders,
        completedPurchaseOrders,
        onTimeDeliveryRate,
        qualityAcceptanceRate,
        fulfillmentRate,
        quotationResponseRate,
        calculatedScore,
      },
      create: {
        vendorId,
        periodStart,
        periodEnd,
        totalPurchaseOrders,
        completedPurchaseOrders,
        onTimeDeliveryRate,
        qualityAcceptanceRate,
        fulfillmentRate,
        quotationResponseRate,
        calculatedScore,
      },
    });

    return metric;
  }
}
