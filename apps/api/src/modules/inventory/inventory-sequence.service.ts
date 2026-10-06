import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class InventorySequenceService {
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

    const sequence = existing
      ? await this.prisma.inventorySequence.update({
          where: { id: existing.id },
          data: { currentNumber: { increment: 1 } },
        })
      : await this.prisma.inventorySequence.create({
          data: {
            organizationId,
            communityId: communityId ?? null,
            sequenceType,
            year,
            prefix,
            currentNumber: 1,
          },
        });

    const padded = String(sequence.currentNumber).padStart(6, '0');
    return `${prefix}-${year}-${padded}`;
  }
}
