import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetBalanceProjection } from '@prisma/client';

@Injectable()
export class BudgetBalanceProjectionService {
  constructor(private readonly prisma: PrismaService) {}

  async rebuildProjections(budgetId?: string): Promise<number> {
    const whereBudget = budgetId ? { budgetId } : {};
    const lines = await this.prisma.budgetLine.findMany({
      where: whereBudget,
      include: { budget: true },
    });

    let count = 0;
    for (const line of lines) {
      const originalBudget = Number(line.annualAmount);
      const currentApprovedBudget = Number(line.currentAmount || line.annualAmount);

      // 1. Calculate Actuals from GL
      const actualAgg = await this.prisma.generalLedgerEntry.aggregate({
        where: {
          accountId: line.accountId,
          fiscalYearId: line.budget.fiscalYearId,
        },
        _sum: { debitAmount: true, creditAmount: true },
      });
      const debit = Number(actualAgg._sum?.debitAmount || 0);
      const credit = Number(actualAgg._sum?.creditAmount || 0);
      const actualYtd =
        line.lineType === 'REVENUE' ? Math.max(0, credit - debit) : Math.max(0, debit - credit);

      // 2. Commitments & Reservations
      const comAgg = await this.prisma.budgetCommitmentEntry.aggregate({
        where: {
          budgetLineId: line.id,
          entryType: 'COMMITMENT',
          status: 'ACTIVE',
        },
        _sum: { amount: true },
      });
      const commitments = Number(comAgg._sum.amount || 0);

      const resAgg = await this.prisma.budgetCommitmentEntry.aggregate({
        where: {
          budgetLineId: line.id,
          entryType: 'RESERVATION',
          status: 'ACTIVE',
        },
        _sum: { amount: true },
      });
      const reservations = Number(resAgg._sum.amount || 0);

      const availableBudget = currentApprovedBudget - actualYtd - commitments - reservations;
      const utilizationPercent =
        currentApprovedBudget > 0 ? (actualYtd / currentApprovedBudget) * 100 : 0;

      await this.prisma.budgetBalanceProjection.upsert({
        where: { budgetLineId: line.id },
        update: {
          originalBudget,
          currentApprovedBudget,
          actualYtd,
          commitments,
          reservations,
          availableBudget,
          forecastFullYear: currentApprovedBudget,
          utilizationPercent,
        },
        create: {
          budgetLineId: line.id,
          originalBudget,
          currentApprovedBudget,
          actualYtd,
          commitments,
          reservations,
          availableBudget,
          forecastFullYear: currentApprovedBudget,
          utilizationPercent,
        },
      });
      count++;
    }

    return count;
  }

  async getProjection(budgetLineId: string): Promise<BudgetBalanceProjection | null> {
    return this.prisma.budgetBalanceProjection.findUnique({
      where: { budgetLineId },
    });
  }
}
