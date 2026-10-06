import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ApSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextNumber(
    organizationId: string,
    sequenceType: 'INVOICE' | 'CREDIT_NOTE' | 'PAYMENT_RUN' | 'PAYMENT' | 'ADVANCE' | 'PROPOSAL',
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefixMap: Record<string, string> = {
      INVOICE: 'APINV',
      CREDIT_NOTE: 'APCN',
      PAYMENT_RUN: 'PAYRUN',
      PAYMENT: 'VPAY',
      ADVANCE: 'VADV',
      PROPOSAL: 'PROP',
    };
    const prefix = prefixMap[sequenceType] || 'AP';

    const shortSeqType = `AP_${sequenceType}`.slice(0, 50);

    const existing = await this.prisma.inventorySequence.findFirst({
      where: {
        organizationId,
        sequenceType: shortSeqType,
        year,
        prefix,
      },
    });

    let seqNum = 1;
    if (existing) {
      const updated = await this.prisma.inventorySequence.update({
        where: { id: existing.id },
        data: { currentNumber: { increment: 1 } },
      });
      seqNum = updated.currentNumber;
    } else {
      let initialCount = 1;
      if (sequenceType === 'INVOICE') {
        const count = await this.prisma.supplierInvoice.count({ where: { organizationId } });
        initialCount = count + 1;
      } else if (sequenceType === 'PAYMENT') {
        const count = await this.prisma.vendorPayment.count({ where: { organizationId } });
        initialCount = count + 1;
      } else if (sequenceType === 'CREDIT_NOTE') {
        const count = await this.prisma.supplierCreditNote.count({ where: { organizationId } });
        initialCount = count + 1;
      } else if (sequenceType === 'ADVANCE') {
        const count = await this.prisma.vendorAdvance.count({ where: { organizationId } });
        initialCount = count + 1;
      } else if (sequenceType === 'PAYMENT_RUN') {
        const count = await this.prisma.paymentRun.count({ where: { organizationId } });
        initialCount = count + 1;
      }

      const created = await this.prisma.inventorySequence.create({
        data: {
          organizationId,
          sequenceType: shortSeqType,
          year,
          prefix,
          currentNumber: initialCount,
        },
      });
      seqNum = created.currentNumber;
    }

    const padded = String(seqNum).padStart(6, '0');
    let candidate = `${prefix}-${year}-${padded}`;

    if (sequenceType === 'INVOICE') {
      const exists = await this.prisma.supplierInvoice.findFirst({
        where: { organizationId, internalInvoiceNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (sequenceType === 'PAYMENT') {
      const exists = await this.prisma.vendorPayment.findFirst({
        where: { organizationId, paymentNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (sequenceType === 'CREDIT_NOTE') {
      const exists = await this.prisma.supplierCreditNote.findFirst({
        where: { organizationId, creditNoteNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (sequenceType === 'ADVANCE') {
      const exists = await this.prisma.vendorAdvance.findFirst({
        where: { organizationId, advanceNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (sequenceType === 'PAYMENT_RUN') {
      const exists = await this.prisma.paymentRun.findFirst({
        where: { organizationId, paymentRunNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    return candidate;
  }
}
