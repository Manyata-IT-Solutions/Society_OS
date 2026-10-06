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
import { SupplierCreditNote } from '@prisma/client';

@Injectable()
export class SupplierCreditNoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ApSequenceService,
    private readonly vendorAccountRepo: VendorAccountRepository,
    private readonly subledgerService: VendorSubledgerService,
  ) {}

  async createCreditNote(data: any, actor?: any): Promise<SupplierCreditNote> {
    const vendorAccount = await this.vendorAccountRepo.getOrCreate(
      data.organizationId,
      data.accountingEntityId,
      data.vendorId,
    );

    const creditNoteNumber = await this.sequenceService.getNextNumber(
      data.organizationId,
      'CREDIT_NOTE',
    );
    const amount = Number(data.amount);
    const userId = actor?.userId || actor?.id;

    const creditNote = await this.prisma.supplierCreditNote.create({
      data: {
        organization: { connect: { id: data.organizationId } },
        accountingEntity: { connect: { id: data.accountingEntityId } },
        vendor: { connect: { id: data.vendorId } },
        vendorAccount: { connect: { id: vendorAccount.id } },
        supplierInvoice: data.supplierInvoiceId
          ? { connect: { id: data.supplierInvoiceId } }
          : undefined,
        creditNoteNumber,
        vendorCreditReference: data.vendorCreditReference,
        creditNoteDate: new Date(data.creditNoteDate),
        currency: data.currency || 'INR',
        amount,
        allocatedAmount: 0,
        unallocatedAmount: amount,
        reason: data.reason,
        status: 'POSTED',
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    // Post to Vendor Subledger (Debit decreases vendor payable)
    await this.subledgerService.postEntry({
      vendorAccountId: vendorAccount.id,
      entryDate: new Date(data.creditNoteDate),
      entryType: 'CREDIT_NOTE',
      referenceType: 'CREDIT_NOTE',
      referenceId: creditNoteNumber,
      debit: amount,
      credit: 0,
      description: `Supplier Credit Note ${data.vendorCreditReference} (${data.reason})`,
    });

    // If linked to specific invoice, allocate directly
    if (data.supplierInvoiceId) {
      await this.allocateCreditNote(creditNote.id, data.supplierInvoiceId, amount);
    }

    return creditNote;
  }

  async allocateCreditNote(creditNoteId: string, invoiceId: string, amount: number): Promise<void> {
    const creditNote = await this.prisma.supplierCreditNote.findUnique({
      where: { id: creditNoteId },
    });
    if (!creditNote) throw new NotFoundException('Credit note not found');

    const invoice = await this.prisma.supplierInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Supplier invoice not found');

    const allocAmount = Math.min(
      amount,
      Number(creditNote.unallocatedAmount),
      Number(invoice.outstandingAmount),
    );
    if (allocAmount <= 0) return;

    await this.prisma.$transaction([
      this.prisma.supplierCreditNoteAllocation.create({
        data: {
          supplierCreditNote: { connect: { id: creditNoteId } },
          supplierInvoice: { connect: { id: invoiceId } },
          allocationAmount: allocAmount,
        },
      }),
      this.prisma.supplierCreditNote.update({
        where: { id: creditNoteId },
        data: {
          allocatedAmount: { increment: allocAmount },
          unallocatedAmount: { decrement: allocAmount },
          status:
            Number(creditNote.unallocatedAmount) - allocAmount <= 0.001
              ? 'FULLY_ALLOCATED'
              : 'PARTIALLY_ALLOCATED',
        },
      }),
      this.prisma.supplierInvoice.update({
        where: { id: invoiceId },
        data: {
          allocatedCreditAmount: { increment: allocAmount },
          outstandingAmount: { decrement: allocAmount },
          status:
            Number(invoice.outstandingAmount) - allocAmount <= 0.001 ? 'PAID' : 'PARTIALLY_PAID',
        },
      }),
    ]);
  }

  async list(accountingEntityId: string): Promise<SupplierCreditNote[]> {
    return this.prisma.supplierCreditNote.findMany({
      where: { accountingEntityId },
      include: { vendor: true, supplierInvoice: true, allocations: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
