import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetLine } from '@prisma/client';

@Injectable()
export class BudgetResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveBudgetLine(params: {
    accountingEntityId: string;
    communityId?: string;
    fiscalYearId?: string;
    accountId: string;
    fundId?: string;
    costCenterId?: string;
    capexInitiativeId?: string;
    date?: Date | string;
  }): Promise<BudgetLine | null> {
    const effectiveDate = params.date ? new Date(params.date) : new Date();

    // 1. Find active budget for entity & date
    let budget = null;
    if (params.fiscalYearId) {
      budget = await this.prisma.budget.findFirst({
        where: {
          accountingEntityId: params.accountingEntityId,
          fiscalYearId: params.fiscalYearId,
          status: { in: ['ACTIVE', 'APPROVED'] },
        },
        include: { lines: true },
      });
    }

    if (!budget) {
      budget = await this.prisma.budget.findFirst({
        where: {
          accountingEntityId: params.accountingEntityId,
          status: { in: ['ACTIVE', 'APPROVED'] },
          effectiveFrom: { lte: effectiveDate },
          effectiveTo: { gte: effectiveDate },
        },
        include: { lines: true },
      });
    }

    if (!budget) {
      // Fallback to most recent active/approved budget
      budget = await this.prisma.budget.findFirst({
        where: {
          accountingEntityId: params.accountingEntityId,
          status: { in: ['ACTIVE', 'APPROVED'] },
        },
        orderBy: { createdAt: 'desc' },
        include: { lines: true },
      });
    }

    if (!budget || !budget.lines || budget.lines.length === 0) return null;

    // 2. Multi-dimensional matching precedence
    // Case A: Exact Capex Initiative match
    if (params.capexInitiativeId) {
      const match = budget.lines.find(
        (l) => l.capexInitiativeId === params.capexInitiativeId && l.accountId === params.accountId,
      );
      if (match) return match;
    }

    // Case B: Account + Fund + CostCenter match
    if (params.fundId && params.costCenterId) {
      const match = budget.lines.find(
        (l) =>
          l.accountId === params.accountId &&
          l.fundId === params.fundId &&
          l.costCenterId === params.costCenterId,
      );
      if (match) return match;
    }

    // Case C: Account + Fund match
    if (params.fundId) {
      const match = budget.lines.find(
        (l) => l.accountId === params.accountId && l.fundId === params.fundId,
      );
      if (match) return match;
    }

    // Case D: Account + CostCenter match
    if (params.costCenterId) {
      const match = budget.lines.find(
        (l) => l.accountId === params.accountId && l.costCenterId === params.costCenterId,
      );
      if (match) return match;
    }

    // Case E: Account only
    const fallback = budget.lines.find((l) => l.accountId === params.accountId);
    return fallback || null;
  }
}
