function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApSequenceService } from './ap-sequence.service.js';
import { PaymentProposal } from '@prisma/client';

@Injectable()
export class PaymentProposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ApSequenceService,
  ) {}

  async generateProposal(data: any, actor?: any): Promise<PaymentProposal> {
    const dueThrough = new Date(data.dueThroughDate);

    // Find eligible invoices: APPROVED/POSTED/PARTIALLY_PAID, outstanding > 0, NOT on hold, due <= dueThrough
    const invoices = await this.prisma.supplierInvoice.findMany({
      where: {
        accountingEntityId: data.accountingEntityId,
        communityId: data.communityId || undefined,
        vendorId: data.vendorId || undefined,
        status: { in: ['APPROVED', 'POSTED', 'PARTIALLY_PAID'] },
        isOnHold: false,
        outstandingAmount: { gt: 0 },
        dueDate: { lte: dueThrough },
      },
      include: { vendorAccount: true },
      orderBy: { dueDate: 'asc' },
    });

    const proposalNumber = await this.sequenceService.getNextNumber(
      data.organizationId ||
        (await this.prisma.accountingEntity.findUnique({ where: { id: data.accountingEntityId } }))
          ?.organizationId ||
        data.accountingEntityId,
      'PROPOSAL',
    );

    let totalProposed = 0;
    const vendorSet = new Set<string>();

    const linesData = invoices.map((inv) => {
      const out = Number(inv.outstandingAmount);
      totalProposed += out;
      vendorSet.add(inv.vendorId);
      return {
        supplierInvoice: { connect: { id: inv.id } },
        vendorAccountId: inv.vendorAccountId,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        outstandingAmount: out,
        proposedAmount: out,
        discountTaken: 0,
        netPaymentAmount: out,
        isSelected: true,
      };
    });

    const orgId =
      data.organizationId ||
      (await this.prisma.accountingEntity.findUnique({ where: { id: data.accountingEntityId } }))
        ?.organizationId;
    const userId = actor?.userId || actor?.id;

    return this.prisma.paymentProposal.create({
      data: {
        organization: { connect: { id: orgId } },
        accountingEntity: { connect: { id: data.accountingEntityId } },
        communityId: data.communityId || undefined,
        bankAccount: { connect: { id: data.bankAccountId } },
        proposalNumber,
        dueThroughDate: dueThrough,
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        currency: data.currency || 'INR',
        totalProposedAmount: totalProposed,
        totalDiscountAmount: 0,
        totalNetAmount: totalProposed,
        vendorCount: vendorSet.size,
        invoiceCount: invoices.length,
        status: 'PROPOSED',
        createdById: isValidUuid(userId) ? userId : undefined,
        lines: {
          create: linesData,
        },
      },
      include: { lines: { include: { supplierInvoice: true } } },
    });
  }

  async list(accountingEntityId: string): Promise<PaymentProposal[]> {
    return this.prisma.paymentProposal.findMany({
      where: { accountingEntityId },
      include: { bankAccount: true, lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.paymentProposal.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        lines: { include: { supplierInvoice: { include: { vendor: true } } } },
      },
    });
  }
}
