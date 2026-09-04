import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class BudgetSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextNumber(
    organizationId: string,
    sequenceType: 'BUDGET' | 'AMENDMENT' | 'TRANSFER' | 'CAPEX' | 'FORECAST',
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefixMap: Record<string, string> = {
      BUDGET: 'BUD',
      AMENDMENT: 'AMEND',
      TRANSFER: 'XFER',
      CAPEX: 'CAPEX',
      FORECAST: 'FCST',
    };

    const prefix = prefixMap[sequenceType] || 'BUD';
    const count = await this.prisma.budget.count({
      where: { organizationId },
    });

    const seq = (count + 1).toString().padStart(5, '0');
    return `${prefix}-${year}-${seq}`;
  }
}
