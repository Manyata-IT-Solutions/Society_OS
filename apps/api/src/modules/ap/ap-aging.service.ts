import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApAgingSummary } from '@community-os/types';

@Injectable()
export class ApAgingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgingMatrix(accountingEntityId: string, asOfDateStr?: string): Promise<ApAgingSummary> {
    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();

    const openInvoices = await this.prisma.supplierInvoice.findMany({
      where: {
        accountingEntityId,
        status: { in: ['APPROVED', 'POSTED', 'PARTIALLY_PAID', 'ON_HOLD'] },
        outstandingAmount: { gt: 0 },
      },
    });

    let notDue = 0;
    let bucket0to30 = 0;
    let bucket31to60 = 0;
    let bucket61to90 = 0;
    let bucket91to120 = 0;
    let bucket120Plus = 0;
    let totalPayable = 0;

    const vendorsSet = new Set<string>();

    for (const inv of openInvoices) {
      const outstanding = Number(inv.outstandingAmount);
      totalPayable += outstanding;
      vendorsSet.add(inv.vendorId);

      const dueDate = new Date(inv.dueDate);
      const diffTime = asOfDate.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        notDue += outstanding;
      } else if (diffDays <= 30) {
        bucket0to30 += outstanding;
      } else if (diffDays <= 60) {
        bucket31to60 += outstanding;
      } else if (diffDays <= 90) {
        bucket61to90 += outstanding;
      } else if (diffDays <= 120) {
        bucket91to120 += outstanding;
      } else {
        bucket120Plus += outstanding;
      }
    }

    return {
      accountingEntityId,
      asOfDate: asOfDate.toISOString().slice(0, 10),
      totalPayable,
      notDue,
      bucket0to30,
      bucket31to60,
      bucket61to90,
      bucket91to120,
      bucket120Plus,
      vendorCount: vendorsSet.size,
      invoiceCount: openInvoices.length,
    };
  }
}
