import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class BillingSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextNumber(
    communityId: string,
    sequenceType: 'INVOICE' | 'RECEIPT' | 'PAYMENT' | 'WAIVER' | 'CREDIT_NOTE' | 'RUN',
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefixMap: Record<string, string> = {
      INVOICE: 'INV',
      RECEIPT: 'RCT',
      PAYMENT: 'PAY',
      WAIVER: 'WAV',
      CREDIT_NOTE: 'CN',
      RUN: 'RUN',
    };
    const prefix = prefixMap[sequenceType] || 'BIL';

    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { organizationId: true },
    });
    const orgId = community?.organizationId || communityId;

    const shortSeqType = `BIL_${sequenceType}`.slice(0, 50);

    const existing = await this.prisma.inventorySequence.findFirst({
      where: {
        organizationId: orgId,
        communityId,
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
        const count = await this.prisma.invoice.count({ where: { communityId } });
        initialCount = count + 1;
      } else if (sequenceType === 'PAYMENT') {
        const count = await this.prisma.payment.count({ where: { communityId } });
        initialCount = count + 1;
      } else if (sequenceType === 'RECEIPT') {
        const count = await this.prisma.receipt.count({ where: { communityId } });
        initialCount = count + 1;
      } else if (sequenceType === 'WAIVER') {
        const count = await this.prisma.waiverRequest.count({ where: { communityId } });
        initialCount = count + 1;
      } else if (sequenceType === 'CREDIT_NOTE') {
        const count = await this.prisma.creditNote.count({ where: { communityId } });
        initialCount = count + 1;
      } else if (sequenceType === 'RUN') {
        const count = await this.prisma.billingRun.count({ where: { communityId } });
        initialCount = count + 1;
      }

      const created = await this.prisma.inventorySequence.create({
        data: {
          organizationId: orgId,
          communityId,
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

    if (sequenceType === 'PAYMENT') {
      const exists = await this.prisma.payment.findFirst({
        where: { communityId, paymentNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (sequenceType === 'WAIVER') {
      const exists = await this.prisma.waiverRequest.findFirst({
        where: { communityId, waiverNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (sequenceType === 'INVOICE') {
      const exists = await this.prisma.invoice.findFirst({
        where: { communityId, invoiceNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (sequenceType === 'RECEIPT') {
      const exists = await this.prisma.receipt.findFirst({
        where: { communityId, receiptNumber: candidate },
      });
      if (exists)
        candidate = `${prefix}-${year}-${padded}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    return candidate;
  }
}
