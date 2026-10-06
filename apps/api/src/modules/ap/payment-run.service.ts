function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApSequenceService } from './ap-sequence.service.js';
import { VendorPaymentService } from './vendor-payment.service.js';
import { PaymentRun } from '@prisma/client';

@Injectable()
export class PaymentRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ApSequenceService,
    private readonly vendorPaymentService: VendorPaymentService,
  ) {}

  async createPaymentRunFromProposal(proposalId: string, actor?: any): Promise<PaymentRun> {
    const proposal = await this.prisma.paymentProposal.findUnique({
      where: { id: proposalId },
      include: { lines: { where: { isSelected: true }, include: { supplierInvoice: true } } },
    });
    if (!proposal) throw new NotFoundException('Payment proposal not found');

    const paymentRunNumber = await this.sequenceService.getNextNumber(
      proposal.organizationId,
      'PAYMENT_RUN',
    );
    const userId = actor?.userId || actor?.id;

    const run = await this.prisma.paymentRun.create({
      data: {
        organization: { connect: { id: proposal.organizationId } },
        accountingEntity: { connect: { id: proposal.accountingEntityId } },
        communityId: proposal.communityId || undefined,
        paymentProposal: { connect: { id: proposal.id } },
        bankAccount: { connect: { id: proposal.bankAccountId } },
        paymentRunNumber,
        paymentDate: new Date(),
        currency: proposal.currency,
        totalAmount: proposal.totalNetAmount,
        paymentCount: proposal.lines.length,
        status: 'APPROVED',
        createdById: isValidUuid(userId) ? userId : undefined,
        approvedById: isValidUuid(userId) ? userId : undefined,
        approvedAt: new Date(),
      },
    });

    await this.prisma.paymentProposal.update({
      where: { id: proposalId },
      data: { status: 'APPROVED' },
    });

    return run;
  }

  async executePaymentRun(paymentRunId: string, actor?: any): Promise<PaymentRun> {
    const run = await this.prisma.paymentRun.findUnique({
      where: { id: paymentRunId },
      include: {
        paymentProposal: {
          include: {
            lines: {
              where: { isSelected: true },
              include: { supplierInvoice: true },
            },
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Payment run not found');
    if (run.status === 'COMPLETED') return run;

    // Group proposal lines by Vendor Account
    const vendorMap = new Map<string, Array<{ invoiceId: string; amount: number }>>();
    if (run.paymentProposal?.lines) {
      for (const line of run.paymentProposal.lines) {
        const vAccId = line.supplierInvoice.vendorAccountId;
        if (!vendorMap.has(vAccId)) vendorMap.set(vAccId, []);
        vendorMap.get(vAccId)!.push({
          invoiceId: line.supplierInvoiceId,
          amount: Number(line.netPaymentAmount),
        });
      }
    }

    // Execute payment per vendor account
    for (const [vendorAccountId, allocs] of vendorMap.entries()) {
      const totalVendorAmount = allocs.reduce((sum, a) => sum + a.amount, 0);
      await this.vendorPaymentService.recordPayment(
        {
          organizationId: run.organizationId,
          accountingEntityId: run.accountingEntityId,
          communityId: run.communityId || undefined,
          paymentRunId: run.id,
          vendorAccountId,
          bankAccountId: run.bankAccountId,
          amount: totalVendorAmount,
          currency: run.currency,
          paymentDate: run.paymentDate,
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: `RUN-${run.paymentRunNumber}-${vendorAccountId.slice(0, 6)}`,
          allocations: allocs.map((a) => ({ supplierInvoiceId: a.invoiceId, amount: a.amount })),
        },
        actor,
      );
    }

    return this.prisma.paymentRun.update({
      where: { id: paymentRunId },
      data: {
        status: 'COMPLETED',
        executedAt: new Date(),
      },
      include: { payments: true },
    });
  }

  async list(accountingEntityId: string): Promise<PaymentRun[]> {
    return this.prisma.paymentRun.findMany({
      where: { accountingEntityId },
      include: { bankAccount: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
