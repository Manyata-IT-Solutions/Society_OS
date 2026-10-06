function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApSequenceService } from './ap-sequence.service.js';
import { VendorSubledgerService } from './vendor-subledger.service.js';
import { ApFinancePostingService } from './ap-finance-posting.service.js';
import { RemittanceAdviceService } from './remittance-advice.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import { VendorPayment } from '@prisma/client';

@Injectable()
export class VendorPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ApSequenceService,
    private readonly subledgerService: VendorSubledgerService,
    private readonly financePosting: ApFinancePostingService,
    private readonly remittanceService: RemittanceAdviceService,
    private readonly eventsService: EventsService,
  ) {}

  async recordPayment(data: any, actor?: any): Promise<VendorPayment> {
    const vendorAccount = await this.prisma.vendorAccount.findUnique({
      where: { id: data.vendorAccountId },
      include: { vendor: true },
    });
    if (!vendorAccount) throw new NotFoundException('Vendor account not found');

    // Idempotency check
    if (data.idempotencyKey) {
      const existing = await this.prisma.vendorPayment.findFirst({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) return existing;
    }

    const orgId = data.organizationId || vendorAccount.organizationId;
    const paymentNumber = await this.sequenceService.getNextNumber(orgId, 'PAYMENT');
    const amount = Number(data.amount);
    const userId = actor?.userId || actor?.id;

    const payment = await this.prisma.vendorPayment.create({
      data: {
        organization: { connect: { id: orgId } },
        accountingEntity: { connect: { id: data.accountingEntityId } },
        communityId: data.communityId || undefined,
        paymentRun: data.paymentRunId ? { connect: { id: data.paymentRunId } } : undefined,
        vendorAccount: { connect: { id: vendorAccount.id } },
        bankAccount: data.bankAccountId ? { connect: { id: data.bankAccountId } } : undefined,
        paymentNumber,
        paymentDate: new Date(data.paymentDate),
        amount,
        allocatedAmount: 0,
        unallocatedAmount: amount,
        currency: data.currency || vendorAccount.currency || 'INR',
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        referenceNumber: data.referenceNumber || paymentNumber,
        chequeNumber: data.chequeNumber || undefined,
        status: 'SUCCESS',
        idempotencyKey: data.idempotencyKey || undefined,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    // 1. Post to Vendor Subledger (Debit decreases payable)
    await this.subledgerService.postEntry({
      vendorAccountId: vendorAccount.id,
      entryDate: new Date(data.paymentDate),
      entryType: 'PAYMENT',
      referenceType: 'PAYMENT',
      referenceId: paymentNumber,
      debit: amount,
      credit: 0,
      description: `Payment ${paymentNumber} (${data.paymentMethod})`,
    });

    // 2. Post to GL
    const _journalId = await this.financePosting.postVendorPayment(payment.id, actor);

    // 3. Allocate to Invoices (either specific allocations or FIFO)
    if (data.allocations && data.allocations.length > 0) {
      for (const alloc of data.allocations) {
        await this.applySingleAllocation(payment.id, alloc.supplierInvoiceId, alloc.amount);
      }
    } else {
      // Auto-allocate FIFO against open invoices for this vendor account
      let available = amount;
      const openInvoices = await this.prisma.supplierInvoice.findMany({
        where: {
          vendorAccountId: vendorAccount.id,
          status: { in: ['APPROVED', 'POSTED', 'PARTIALLY_PAID'] },
          outstandingAmount: { gt: 0 },
        },
        orderBy: { dueDate: 'asc' },
      });

      for (const inv of openInvoices) {
        if (available <= 0) break;
        const out = Number(inv.outstandingAmount);
        const toAlloc = Math.min(available, out);
        if (toAlloc > 0) {
          await this.applySingleAllocation(payment.id, inv.id, toAlloc);
          available -= toAlloc;
        }
      }
    }

    // 4. Generate official remittance advice PDF
    await this.remittanceService.generateRemittanceAdvice(payment.id, actor);

    // 5. Emit event
    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).AP_VENDOR_PAYMENT_SUCCEEDED ?? 'ap.vendor_payment.succeeded.v1',
        { paymentId: payment.id, amount, paymentNumber },
        { organizationId: orgId, userId },
      ),
    );

    const updated = await this.prisma.vendorPayment.findUnique({
      where: { id: payment.id },
      include: { allocations: true, vendorAccount: true },
    });
    return updated || payment;
  }

  private async applySingleAllocation(
    paymentId: string,
    invoiceId: string,
    amount: number,
  ): Promise<void> {
    const invoice = await this.prisma.supplierInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    const out = Number(invoice.outstandingAmount);
    const toAlloc = Math.min(amount, out);
    if (toAlloc <= 0) return;

    await this.prisma.$transaction([
      this.prisma.vendorPaymentAllocation.create({
        data: {
          vendorPayment: { connect: { id: paymentId } },
          supplierInvoice: { connect: { id: invoiceId } },
          allocationAmount: toAlloc,
        },
      }),
      this.prisma.vendorPayment.update({
        where: { id: paymentId },
        data: {
          allocatedAmount: { increment: toAlloc },
          unallocatedAmount: { decrement: toAlloc },
        },
      }),
      this.prisma.supplierInvoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: { increment: toAlloc },
          outstandingAmount: { decrement: toAlloc },
          status: out - toAlloc <= 0.001 ? 'PAID' : 'PARTIALLY_PAID',
        },
      }),
    ]);
  }

  async reversePayment(paymentId: string, reason: string, _actor?: any): Promise<VendorPayment> {
    const payment = await this.prisma.vendorPayment.findUnique({
      where: { id: paymentId },
      include: { allocations: true, vendorAccount: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'REVERSED') {
      throw new BadRequestException('Payment is already reversed');
    }

    // 1. Rollback invoice allocations
    for (const alloc of payment.allocations) {
      await this.prisma.supplierInvoice.update({
        where: { id: alloc.supplierInvoiceId },
        data: {
          paidAmount: { decrement: Number(alloc.allocationAmount) },
          outstandingAmount: { increment: Number(alloc.allocationAmount) },
          status: 'POSTED',
        },
      });
    }

    // 2. Post reversal entry to Vendor Subledger (Credit restores payable)
    await this.subledgerService.postEntry({
      vendorAccountId: payment.vendorAccountId,
      entryDate: new Date(),
      entryType: 'PAYMENT_REVERSAL',
      referenceType: 'PAYMENT_REVERSAL',
      referenceId: payment.paymentNumber,
      debit: 0,
      credit: Number(payment.amount),
      description: `Payment Reversal for ${payment.paymentNumber} (${reason})`,
    });

    const reversed = await this.prisma.vendorPayment.update({
      where: { id: paymentId },
      data: {
        status: 'REVERSED',
        reversedAt: new Date(),
        reversalReason: reason,
      },
    });

    return reversed;
  }

  async list(accountingEntityId: string): Promise<VendorPayment[]> {
    return this.prisma.vendorPayment.findMany({
      where: { accountingEntityId },
      include: {
        vendorAccount: { include: { vendor: true } },
        bankAccount: true,
        allocations: { include: { supplierInvoice: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.vendorPayment.findUnique({
      where: { id },
      include: {
        vendorAccount: { include: { vendor: true } },
        bankAccount: true,
        allocations: { include: { supplierInvoice: true } },
      },
    });
  }
}
