function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ReceiptRepository } from './receipt.repository.js';
import { BillingSequenceService } from './billing-sequence.service.js';
import { Receipt } from '@prisma/client';

@Injectable()
export class ReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptRepo: ReceiptRepository,
    private readonly sequenceService: BillingSequenceService,
  ) {}

  async generateReceipt(paymentId: string, actor?: any): Promise<Receipt> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new Error('Payment not found');

    const existing = await this.receiptRepo.findByPaymentId(paymentId);
    if (existing) return existing;

    const receiptNumber = await this.sequenceService.getNextNumber(payment.communityId, 'RECEIPT');

    const doc = await this.prisma.document.create({
      data: {
        organization: { connect: { id: payment.organizationId } },
        community: { connect: { id: payment.communityId } },
        title: `Receipt ${receiptNumber}.pdf`,
        category: 'FINANCIAL',
        classification: 'INTERNAL',
        status: 'ACTIVE',
        versions: {
          create: {
            versionNumber: 1,
            fileName: `${receiptNumber}.pdf`,
            originalFileName: `${receiptNumber}.pdf`,
            storageKey: `documents/receipts/${receiptNumber}.pdf`,
            mimeType: 'application/pdf',
            sizeBytes: BigInt(35000),
            checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        },
      },
    });

    const userId = actor?.userId || actor?.id;

    return this.receiptRepo.create({
      community: { connect: { id: payment.communityId } },
      payment: { connect: { id: payment.id } },
      billableAccount: { connect: { id: payment.billableAccountId } },
      receiptNumber,
      receiptDate: payment.paymentDate,
      amount: payment.receivedAmount,
      status: 'SUCCESS',
      document: { connect: { id: doc.id } },
      createdBy: isValidUuid(userId) ? { connect: { id: userId } } : undefined,
    });
  }

  async getReceipt(id: string): Promise<Receipt | null> {
    return this.receiptRepo.findById(id);
  }

  async listReceipts(params: {
    communityId: string;
    billableAccountId?: string;
    skip?: number;
    take?: number;
  }): Promise<[Receipt[], number]> {
    return this.receiptRepo.list(params);
  }
}
