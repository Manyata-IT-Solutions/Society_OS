function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PaymentRepository } from './payment.repository.js';
import { BillingSequenceService } from './billing-sequence.service.js';
import { ResidentLedgerService } from './resident-ledger.service.js';
import { ReceiptService } from './receipt.service.js';
import { PaymentAllocationService } from './payment-allocation.service.js';
import { BillingFinancePostingService } from './billing-finance-posting.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { Payment } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentRepo: PaymentRepository,
    private readonly sequenceService: BillingSequenceService,
    private readonly ledgerService: ResidentLedgerService,
    private readonly receiptService: ReceiptService,
    private readonly allocationService: PaymentAllocationService,
    private readonly financePosting: BillingFinancePostingService,
    private readonly eventsService: EventsService,
  ) {}

  async recordPayment(data: any, actor?: any): Promise<Payment> {
    const community = await this.prisma.community.findUnique({
      where: { id: data.communityId },
    });
    if (!community) throw new NotFoundException('Community not found');

    const paymentNumber = await this.sequenceService.getNextNumber(data.communityId, 'PAYMENT');
    const amount = Number(data.receivedAmount);
    const userId = actor?.userId || actor?.id;

    const payment = await this.paymentRepo.create({
      organization: { connect: { id: community.organizationId } },
      community: { connect: { id: data.communityId } },
      billableAccount: { connect: { id: data.billableAccountId } },
      paymentNumber,
      paymentDate: new Date(data.paymentDate),
      receivedAmount: amount,
      allocatedAmount: 0,
      unallocatedAmount: amount,
      currency: data.currency || 'INR',
      paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
      referenceNumber: data.referenceNumber,
      chequeNumber: data.chequeNumber,
      chequeDate: data.chequeDate ? new Date(data.chequeDate) : undefined,
      chequeBank: data.chequeBank,
      chequeStatus: data.paymentMethod === 'CHEQUE' ? 'RECEIVED' : undefined,
      status: 'SUCCESS',
      idempotencyKey: data.idempotencyKey,
      receivedBy: isValidUuid(userId) ? { connect: { id: userId } } : undefined,
    });

    await this.ledgerService.postEntry({
      billableAccountId: data.billableAccountId,
      entryDate: new Date(data.paymentDate),
      entryType: 'RECEIPT',
      referenceType: 'PAYMENT',
      referenceId: paymentNumber,
      debit: 0,
      credit: amount,
      description: `Payment Received (${data.paymentMethod})`,
    });

    await this.receiptService.generateReceipt(payment.id, actor);

    if (data.autoAllocate !== false) {
      await this.allocationService.allocatePayment({
        paymentId: payment.id,
        rule: data.allocationRule || 'OLDEST_DUE_FIRST',
      });
    }

    await this.financePosting.postPaymentReceive(payment.id, actor);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BILLING_PAYMENT_RECEIVED ?? 'billing.payment.received.v1',
        {
          paymentId: payment.id,
          paymentNumber: payment.paymentNumber,
          amount,
          communityId: data.communityId,
        },
        { organizationId: community.organizationId, userId },
      ),
    );

    return this.paymentRepo.findById(payment.id) as Promise<Payment>;
  }

  async getPayment(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async listPayments(params: {
    communityId: string;
    billableAccountId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<[Payment[], number]> {
    return this.paymentRepo.list(params);
  }
}
