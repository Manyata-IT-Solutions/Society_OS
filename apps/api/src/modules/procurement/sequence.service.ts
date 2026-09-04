import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ProcurementSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextNumber(
    organizationId: string,
    communityId: string | null,
    sequenceType: string,
    prefix: string,
  ): Promise<string> {
    const year = new Date().getFullYear();

    const existing = await this.prisma.inventorySequence.findFirst({
      where: {
        organizationId,
        communityId: communityId ?? null,
        sequenceType,
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
      const created = await this.prisma.inventorySequence.create({
        data: {
          organizationId,
          communityId: communityId ?? null,
          sequenceType,
          year,
          prefix,
          currentNumber: 1,
        },
      });
      seqNum = created.currentNumber;
    }

    const padded = String(seqNum).padStart(6, '0');
    let candidate = `${prefix}-${year}-${padded}`;

    let collision = false;
    if (sequenceType === 'RFQ') {
      const check = await this.prisma.requestForQuotation.findFirst({
        where: { organizationId, rfqNumber: candidate },
      });
      if (check) collision = true;
    } else if (sequenceType === 'PURCHASE_REQUISITION') {
      const check = await this.prisma.purchaseRequisition.findFirst({
        where: { organizationId, requisitionNumber: candidate },
      });
      if (check) collision = true;
    } else if (sequenceType === 'PURCHASE_ORDER') {
      const check = await this.prisma.purchaseOrder.findFirst({
        where: { organizationId, poNumber: candidate },
      });
      if (check) collision = true;
    } else if (sequenceType === 'GOODS_RECEIPT_NOTE') {
      const check = await this.prisma.goodsReceiptNote.findFirst({
        where: { organizationId, grnNumber: candidate },
      });
      if (check) collision = true;
    } else if (sequenceType === 'SOURCING_AWARD') {
      const check = await this.prisma.sourcingAward.findFirst({
        where: { organizationId, awardNumber: candidate },
      });
      if (check) collision = true;
    }

    if (collision) {
      candidate = `${prefix}-${year}-${Date.now().toString().slice(-6)}`;
    }

    return candidate;
  }
}
