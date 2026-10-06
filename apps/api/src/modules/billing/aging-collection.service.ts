import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AgingReportRow, BillingDashboardKpis } from '@community-os/types';

@Injectable()
export class AgingCollectionService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgingMatrix(communityId: string): Promise<AgingReportRow[]> {
    const billableAccounts = await this.prisma.billableAccount.findMany({
      where: { communityId, status: 'ACTIVE' },
      include: {
        unit: { include: { building: true } },
        residentAccount: { include: { outstanding: true } },
      },
      orderBy: { accountNumber: 'asc' },
    });

    return billableAccounts.map((acc) => {
      const out = acc.residentAccount?.outstanding;
      return {
        billableAccountId: acc.id,
        accountNumber: acc.accountNumber,
        displayName: acc.displayName,
        unitNumber: acc.unit?.unitNumber,
        buildingName: acc.unit?.building?.name,
        currentDue: Number(out?.currentDue || 0),
        bucket0To30: Number(out?.bucket0To30 || 0),
        bucket31To60: Number(out?.bucket31To60 || 0),
        bucket61To90: Number(out?.bucket61To90 || 0),
        bucket91Plus: Number(out?.bucket91Plus || 0),
        totalOutstanding: Number(out?.totalOutstanding || 0),
        advanceCredit: Number(out?.advanceCredit || 0),
        collectionStatus: (out?.collectionStatus as any) || 'CURRENT',
      };
    });
  }

  async getDashboardKpis(communityId: string): Promise<BillingDashboardKpis> {
    const invoices = await this.prisma.invoice.findMany({
      where: { communityId },
      select: {
        grandTotal: true,
        allocatedAmount: true,
        outstandingAmount: true,
        status: true,
        dueDate: true,
      },
    });

    let totalBilled = 0;
    let collected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    const invoicesCount = { draft: 0, issued: 0, paid: 0, partiallyPaid: 0, overdue: 0 };
    const agingSummary = {
      current: 0,
      bucket0To30: 0,
      bucket31To60: 0,
      bucket61To90: 0,
      bucket91Plus: 0,
    };
    const now = new Date();

    for (const inv of invoices) {
      const grand = Number(inv.grandTotal);
      const alloc = Number(inv.allocatedAmount);
      const out = Number(inv.outstandingAmount);

      totalBilled += grand;
      collected += alloc;
      totalOutstanding += out;

      if (inv.status === 'DRAFT') invoicesCount.draft++;
      else if (inv.status === 'ISSUED') invoicesCount.issued++;
      else if (inv.status === 'PAID') invoicesCount.paid++;
      else if (inv.status === 'PARTIALLY_PAID') invoicesCount.partiallyPaid++;
      else if (inv.status === 'OVERDUE') invoicesCount.overdue++;

      if (out > 0) {
        const diffDays = Math.floor(
          (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24),
        );
        if (diffDays <= 0) {
          agingSummary.current += out;
        } else {
          totalOverdue += out;
          if (diffDays <= 30) agingSummary.bucket0To30 += out;
          else if (diffDays <= 60) agingSummary.bucket31To60 += out;
          else if (diffDays <= 90) agingSummary.bucket61To90 += out;
          else agingSummary.bucket91Plus += out;
        }
      }
    }

    const collectionPercentage = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0;

    return {
      totalBilled,
      collectedThisPeriod: collected,
      collectionPercentage,
      totalOutstanding,
      totalOverdue,
      totalAdvanceCredit: 0,
      invoicesCount,
      agingSummary,
    };
  }
}
