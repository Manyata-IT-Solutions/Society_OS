import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ResidentLedgerService } from './resident-ledger.service.js';
import { EventsService } from '../events/events.service.js';

@Injectable()
export class PenaltyInterestService {
  private readonly logger = new Logger(PenaltyInterestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: ResidentLedgerService,
    private readonly eventsService: EventsService,
  ) {}

  async runPenaltySweep(
    communityId: string,
    asOfDate: Date = new Date(),
  ): Promise<{ count: number; totalPenalty: number }> {
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        communityId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        outstandingAmount: { gt: 0 },
        graceDate: { lt: asOfDate },
        penaltyTotal: { equals: 0 }, // Idempotent: Only charge penalty if not already penalized
      },
      include: { billableAccount: true },
    });

    let count = 0;
    let totalPenalty = 0;

    for (const inv of overdueInvoices) {
      const penaltyAmount = 250; // Standard Fixed Late Penalty ₹250
      const newPenaltyTotal = Number(inv.penaltyTotal) + penaltyAmount;
      const newGrandTotal = Number(inv.grandTotal) + penaltyAmount;
      const newOutstanding = Number(inv.outstandingAmount) + penaltyAmount;

      await this.prisma.invoice.update({
        where: { id: inv.id },
        data: {
          penaltyTotal: newPenaltyTotal,
          grandTotal: newGrandTotal,
          outstandingAmount: newOutstanding,
          status: 'OVERDUE',
        },
      });

      await this.ledgerService.postEntry({
        billableAccountId: inv.billableAccountId,
        entryDate: asOfDate,
        entryType: 'PENALTY',
        referenceType: 'PENALTY',
        referenceId: inv.invoiceNumber,
        debit: penaltyAmount,
        credit: 0,
        description: `Late Payment Penalty - ${inv.invoiceNumber}`,
      });

      count++;
      totalPenalty += penaltyAmount;
    }

    this.logger.log(
      `Penalty sweep completed for community ${communityId}: ${count} invoices, total ₹${totalPenalty}`,
    );
    return { count, totalPenalty };
  }
}
