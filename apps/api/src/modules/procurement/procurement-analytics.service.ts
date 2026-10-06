import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { ProcurementKpiMetrics } from '@community-os/types';

@Injectable()
export class ProcurementAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(organizationId: string, communityId?: string): Promise<ProcurementKpiMetrics> {
    const commFilter = communityId ? { communityId } : {};

    const [
      openRequisitions,
      requisitionsPendingApproval,
      activeRfqs,
      rfqsClosingSoon,
      quotationsPendingEvaluation,
      purchaseOrdersPendingApproval,
      openPurchaseOrders,
      overdueDeliveries,
      grnsPendingInspection,
      totalVendorsActive,
      vendorsUnderReview,
      issuedPOs,
    ] = await Promise.all([
      this.prisma.purchaseRequisition.count({
        where: {
          organizationId,
          ...commFilter,
          status: { in: ['SUBMITTED', 'UNDER_APPROVAL', 'APPROVED', 'SOURCING'] },
        },
      }),
      this.prisma.purchaseRequisition.count({
        where: { organizationId, ...commFilter, status: { in: ['SUBMITTED', 'UNDER_APPROVAL'] } },
      }),
      this.prisma.requestForQuotation.count({
        where: { organizationId, ...commFilter, status: { in: ['PUBLISHED', 'OPEN'] } },
      }),
      this.prisma.requestForQuotation.count({
        where: {
          organizationId,
          ...commFilter,
          status: { in: ['PUBLISHED', 'OPEN'] },
          submissionDeadline: { lte: new Date(Date.now() + 3 * 86400000) },
        },
      }),
      this.prisma.vendorQuotation.count({
        where: {
          rfq: { organizationId, ...commFilter },
          status: { in: ['SUBMITTED', 'UNDER_EVALUATION'] },
        },
      }),
      this.prisma.purchaseOrder.count({
        where: { organizationId, ...commFilter, status: { in: ['DRAFT', 'UNDER_APPROVAL'] } },
      }),
      this.prisma.purchaseOrder.count({
        where: {
          organizationId,
          ...commFilter,
          status: { in: ['ISSUED', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED'] },
        },
      }),
      this.prisma.purchaseOrder.count({
        where: {
          organizationId,
          ...commFilter,
          status: { in: ['ISSUED', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED'] },
          deliveryRequiredBy: { lt: new Date() },
        },
      }),
      this.prisma.goodsReceiptNote.count({
        where: { organizationId, ...commFilter, status: { in: ['RECEIVED', 'UNDER_INSPECTION'] } },
      }),
      this.prisma.vendor.count({
        where: { organizationId, status: 'ACTIVE', onboardingStatus: 'APPROVED' },
      }),
      this.prisma.vendor.count({
        where: { organizationId, onboardingStatus: 'UNDER_REVIEW' },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { organizationId, ...commFilter, status: { notIn: ['CANCELLED', 'DRAFT'] } },
        select: { grandTotal: true },
      }),
    ]);

    const totalCommittedSpend = issuedPOs.reduce((sum, po) => sum + Number(po.grandTotal), 0);

    return {
      openRequisitions,
      requisitionsPendingApproval,
      activeRfqs,
      rfqsClosingSoon,
      quotationsPendingEvaluation,
      purchaseOrdersPendingApproval,
      openPurchaseOrders,
      overdueDeliveries,
      grnsPendingInspection,
      totalCommittedSpend,
      totalVendorsActive,
      vendorsUnderReview,
    };
  }
}
