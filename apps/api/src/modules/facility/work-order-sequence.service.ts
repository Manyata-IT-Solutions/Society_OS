import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class WorkOrderSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async nextWorkOrderNumber(
    organizationId: string,
    communityId: string,
    prefix = 'WO',
  ): Promise<string> {
    const year = new Date().getUTCFullYear();

    const sequence = await this.prisma.workOrderSequence.upsert({
      where: {
        organizationId_communityId_year_prefix: {
          organizationId,
          communityId,
          year,
          prefix,
        },
      },
      update: {
        currentNumber: {
          increment: 1,
        },
      },
      create: {
        organizationId,
        communityId,
        year,
        prefix,
        currentNumber: 1,
      },
    });

    const formattedNum = String(sequence.currentNumber).padStart(6, '0');
    return `${prefix}-${year}-${formattedNum}`;
  }
}
