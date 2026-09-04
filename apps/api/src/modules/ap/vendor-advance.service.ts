function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ApSequenceService } from './ap-sequence.service.js';
import { VendorAccountRepository } from './vendor-account.repository.js';
import { VendorSubledgerService } from './vendor-subledger.service.js';
import { ApFinancePostingService } from './ap-finance-posting.service.js';
import { VendorAdvance } from '@prisma/client';

@Injectable()
export class VendorAdvanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ApSequenceService,
    private readonly vendorAccountRepo: VendorAccountRepository,
    private readonly subledgerService: VendorSubledgerService,
    private readonly financePosting: ApFinancePostingService,
  ) {}

  async createAdvance(data: any, actor?: any): Promise<VendorAdvance> {
    const vendorAccount = await this.vendorAccountRepo.getOrCreate(
      data.organizationId,
      data.accountingEntityId,
      data.vendorId,
    );

    const advanceNumber = await this.sequenceService.getNextNumber(data.organizationId, 'ADVANCE');
    const amount = Number(data.amount);
    const userId = actor?.userId || actor?.id;

    const advance = await this.prisma.vendorAdvance.create({
      data: {
        organization: { connect: { id: data.organizationId } },
        accountingEntity: { connect: { id: data.accountingEntityId } },
        communityId: data.communityId || undefined,
        vendor: { connect: { id: data.vendorId } },
        vendorAccount: { connect: { id: vendorAccount.id } },
        bankAccount: data.bankAccountId ? { connect: { id: data.bankAccountId } } : undefined,
        purchaseOrder: data.purchaseOrderId ? { connect: { id: data.purchaseOrderId } } : undefined,
        advanceNumber,
        amount,
        allocatedAmount: 0,
        unallocatedAmount: amount,
        currency: data.currency || 'INR',
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        paymentDate: new Date(data.paymentDate),
        referenceNumber: data.referenceNumber || advanceNumber,
        status: 'PAID',
        notes: data.notes,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    // 1. Post to GL
    await this.financePosting.postVendorAdvance(advance.id, actor);

    // 2. Update advance balance on VendorAccount
    await this.prisma.vendorAccount.update({
      where: { id: vendorAccount.id },
      data: { advanceBalance: { increment: amount } },
    });

    return advance;
  }

  async allocateAdvance(advanceId: string, invoiceId: string, amount: number): Promise<void> {
    const advance = await this.prisma.vendorAdvance.findUnique({ where: { id: advanceId } });
    if (!advance) throw new NotFoundException('Vendor advance not found');

    const invoice = await this.prisma.supplierInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Supplier invoice not found');

    const allocAmount = Math.min(
      amount,
      Number(advance.unallocatedAmount),
      Number(invoice.outstandingAmount),
    );
    if (allocAmount <= 0) return;

    await this.prisma.$transaction([
      this.prisma.vendorAdvanceAllocation.create({
        data: {
          vendorAdvance: { connect: { id: advanceId } },
          supplierInvoice: { connect: { id: invoiceId } },
          allocationAmount: allocAmount,
        },
      }),
      this.prisma.vendorAdvance.update({
        where: { id: advanceId },
        data: {
          allocatedAmount: { increment: allocAmount },
          unallocatedAmount: { decrement: allocAmount },
          status:
            Number(advance.unallocatedAmount) - allocAmount <= 0.001
              ? 'FULLY_ALLOCATED'
              : 'PARTIALLY_ALLOCATED',
        },
      }),
      this.prisma.vendorAccount.update({
        where: { id: advance.vendorAccountId },
        data: { advanceBalance: { decrement: allocAmount } },
      }),
      this.prisma.supplierInvoice.update({
        where: { id: invoiceId },
        data: {
          allocatedAdvanceAmount: { increment: allocAmount },
          outstandingAmount: { decrement: allocAmount },
          status:
            Number(invoice.outstandingAmount) - allocAmount <= 0.001 ? 'PAID' : 'PARTIALLY_PAID',
        },
      }),
    ]);
  }

  async list(accountingEntityId: string): Promise<VendorAdvance[]> {
    return this.prisma.vendorAdvance.findMany({
      where: { accountingEntityId },
      include: { vendor: true, bankAccount: true, allocations: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
