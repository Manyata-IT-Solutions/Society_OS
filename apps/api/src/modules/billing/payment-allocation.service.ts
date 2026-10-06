import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AllocationRule } from '@prisma/client';

@Injectable()
export class PaymentAllocationService {
  constructor(private readonly prisma: PrismaService) {}

  async allocatePayment(params: {
    paymentId: string;
    rule?: AllocationRule;
    manualAllocations?: Array<{ invoiceId: string; amount: number }>;
  }): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { billableAccount: true },
    });

    if (!payment) throw new BadRequestException('Payment not found');
    if (payment.status !== 'SUCCESS')
      throw new BadRequestException('Only successful payments can be allocated');

    let availableAmount = Number(payment.receivedAmount) - Number(payment.allocatedAmount);
    if (availableAmount <= 0) return;

    if (params.manualAllocations && params.manualAllocations.length > 0) {
      let totalManual = 0;
      for (const alloc of params.manualAllocations) {
        totalManual += alloc.amount;
        if (totalManual > availableAmount + 0.001) {
          throw new BadRequestException('Allocations exceed available payment amount');
        }

        await this.applySingleAllocation(payment.id, alloc.invoiceId, alloc.amount, 'MANUAL');
      }
      return;
    }

    // Auto-allocation: Find unpaid/partially paid invoices for billable account ordered by due date ascending (FIFO)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        billableAccountId: payment.billableAccountId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        outstandingAmount: { gt: 0 },
      },
      orderBy: { dueDate: 'asc' },
    });

    let seq = 1;
    for (const inv of invoices) {
      if (availableAmount <= 0) break;
      const outstanding = Number(inv.outstandingAmount);
      const toAllocate = Math.min(availableAmount, outstanding);

      if (toAllocate > 0) {
        await this.applySingleAllocation(
          payment.id,
          inv.id,
          toAllocate,
          params.rule || 'OLDEST_DUE_FIRST',
          seq++,
        );
        availableAmount -= toAllocate;
      }
    }

    // Any remaining unallocated becomes Advance Credit on ResidentAccount
    if (availableAmount > 0) {
      await this.prisma.residentAccount.upsert({
        where: { billableAccountId: payment.billableAccountId },
        update: { advanceCredit: { increment: availableAmount } },
        create: {
          billableAccount: { connect: { id: payment.billableAccountId } },
          accountNumber: `RA-${payment.billableAccountId.slice(0, 8)}`,
          openingBalance: 0,
          currentBalance: 0,
          advanceCredit: availableAmount,
        },
      });
    }
  }

  private async applySingleAllocation(
    paymentId: string,
    invoiceId: string,
    amount: number,
    rule: AllocationRule,
    sequence: number = 1,
  ): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    const outstanding = Number(invoice.outstandingAmount);
    const newOutstanding = Math.max(0, outstanding - amount);
    const newAllocated = Number(invoice.allocatedAmount) + amount;
    const newStatus = newOutstanding <= 0.001 ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.$transaction([
      this.prisma.paymentAllocation.create({
        data: {
          payment: { connect: { id: paymentId } },
          invoice: { connect: { id: invoiceId } },
          allocationAmount: amount,
          allocationRule: rule,
          sequence,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          allocatedAmount: newAllocated,
          outstandingAmount: newOutstanding,
          status: newStatus,
        },
      }),
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          allocatedAmount: { increment: amount },
          unallocatedAmount: { decrement: amount },
        },
      }),
    ]);
  }
}
