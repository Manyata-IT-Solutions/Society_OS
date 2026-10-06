import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ResidentLedgerService } from './resident-ledger.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { Payment } from '@prisma/client';

@Injectable()
export class PaymentReversalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: ResidentLedgerService,
    private readonly eventsService: EventsService,
  ) {}

  async reversePayment(paymentId: string, reason: string, actor?: any): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { paymentAllocations: { include: { invoice: true } } },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'REVERSED') throw new BadRequestException('Payment is already reversed');

    const amount = Number(payment.receivedAmount);

    for (const alloc of payment.paymentAllocations) {
      if (!alloc.isReversed) {
        const inv = alloc.invoice;
        const allocAmount = Number(alloc.allocationAmount);
        const newOutstanding = Number(inv.outstandingAmount) + allocAmount;
        const newAllocated = Math.max(0, Number(inv.allocatedAmount) - allocAmount);

        await this.prisma.invoice.update({
          where: { id: inv.id },
          data: {
            outstandingAmount: newOutstanding,
            allocatedAmount: newAllocated,
            status: 'OVERDUE',
          },
        });

        await this.prisma.paymentAllocation.update({
          where: { id: alloc.id },
          data: { isReversed: true, reversedAt: new Date() },
        });
      }
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REVERSED',
        reversedAt: new Date(),
        reversalReason: reason,
        chequeStatus: payment.paymentMethod === 'CHEQUE' ? 'BOUNCED' : undefined,
      },
    });

    await this.ledgerService.postEntry({
      billableAccountId: payment.billableAccountId,
      entryDate: new Date(),
      entryType: 'PAYMENT_REVERSAL',
      referenceType: 'PAYMENT_REVERSAL',
      referenceId: payment.paymentNumber,
      debit: amount,
      credit: 0,
      description: `Payment Reversal / Bounce: ${reason}`,
    });

    const userId = actor?.userId || actor?.id;
    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BILLING_PAYMENT_REVERSED ?? 'billing.payment.reversed.v1',
        { paymentId: payment.id, reason, amount },
        { organizationId: payment.organizationId, userId },
      ),
    );

    return updated;
  }
}
