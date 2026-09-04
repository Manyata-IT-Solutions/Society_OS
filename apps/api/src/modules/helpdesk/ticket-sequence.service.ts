import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class TicketSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Concurrency-safe atomic incrementing ticket number generation.
   * Format: {PREFIX}-{YEAR}-{5-DIGIT-ZERO-PADDED-COUNTER} (e.g., TKT-2026-00001)
   */
  async getNextTicketNumber(
    organizationId: string,
    communityId: string,
    prefix = 'TKT',
    customYear?: number,
  ): Promise<string> {
    const year = customYear || new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ticketSequence.findUnique({
        where: {
          organizationId_communityId_year_prefix: {
            organizationId,
            communityId,
            year,
            prefix,
          },
        },
      });

      if (!existing) {
        const created = await tx.ticketSequence.create({
          data: {
            organizationId,
            communityId,
            year,
            prefix,
            currentNumber: 1,
          },
        });
        return `${prefix}-${year}-${String(created.currentNumber).padStart(5, '0')}`;
      }

      const updated = await tx.ticketSequence.update({
        where: { id: existing.id },
        data: {
          currentNumber: { increment: 1 },
        },
      });

      return `${prefix}-${year}-${String(updated.currentNumber).padStart(5, '0')}`;
    });
  }
}
