import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class FinancialSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextNumber(
    accountingEntityId: string,
    sequenceType: 'GENERAL' | 'OPENING' | 'ADJUSTMENT' | 'REVERSAL' | 'SYSTEM' | string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefixMap: Record<string, string> = {
      GENERAL: 'JV',
      OPENING: 'OB',
      ADJUSTMENT: 'ADJ',
      REVERSAL: 'REV',
      SYSTEM: 'SYS',
    };
    const prefix = prefixMap[sequenceType] || 'JV';

    const entity = await this.prisma.accountingEntity.findUnique({
      where: { id: accountingEntityId },
      select: { organizationId: true },
    });

    const orgId = entity?.organizationId || accountingEntityId;

    const existing = await this.prisma.inventorySequence.findFirst({
      where: {
        organizationId: orgId,
        sequenceType: `FIN_${sequenceType}_${accountingEntityId}`,
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
          organizationId: orgId,
          sequenceType: `FIN_${sequenceType}_${accountingEntityId}`,
          year,
          prefix,
          currentNumber: 1,
        },
      });
      seqNum = created.currentNumber;
    }

    const padded = String(seqNum).padStart(6, '0');
    let candidate = `${prefix}-${year}-${padded}`;

    const check = await this.prisma.journalEntry.findFirst({
      where: { accountingEntityId, journalNumber: candidate },
    });
    if (check) {
      candidate = `${prefix}-${year}-${Date.now().toString().slice(-6)}`;
    }

    return candidate;
  }
}
