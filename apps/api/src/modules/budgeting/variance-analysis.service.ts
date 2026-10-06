function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { VarianceExplanation } from '@prisma/client';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class VarianceAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async getVarianceReport(budgetId: string): Promise<any[]> {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        lines: {
          include: {
            account: true,
            fund: true,
            costCenter: true,
            varianceExplanations: true,
          },
        },
      },
    });
    if (!budget) return [];

    const report = [];
    for (const line of budget.lines) {
      const budgetAmount = Number(line.currentAmount || line.annualAmount);

      const actualAgg = await this.prisma.generalLedgerEntry.aggregate({
        where: {
          accountId: line.accountId,
          fiscalYearId: budget.fiscalYearId,
        },
        _sum: { debitAmount: true, creditAmount: true },
      });
      const debit = Number(actualAgg._sum?.debitAmount || 0);
      const credit = Number(actualAgg._sum?.creditAmount || 0);
      const actualAmount =
        line.lineType === 'REVENUE' ? Math.max(0, credit - debit) : Math.max(0, debit - credit);

      // Variance Calculation & Sign Convention:
      // For Expense: Actual > Budget is UNFAVORABLE (negative performance)
      // For Revenue: Actual < Budget is UNFAVORABLE (shortfall)
      const varianceAmount =
        line.lineType === 'REVENUE' ? actualAmount - budgetAmount : budgetAmount - actualAmount;
      const variancePercent =
        budgetAmount > 0 ? ((actualAmount - budgetAmount) / budgetAmount) * 100 : 0;

      let classification = 'ON_PLAN';
      if (line.lineType === 'REVENUE') {
        classification = actualAmount >= budgetAmount ? 'FAVORABLE' : 'UNFAVORABLE';
      } else {
        classification = actualAmount <= budgetAmount ? 'FAVORABLE' : 'UNFAVORABLE';
      }

      const isMaterial = Math.abs(varianceAmount) > 100000 || Math.abs(variancePercent) > 10;

      report.push({
        budgetLineId: line.id,
        accountCode: line.account.accountCode,
        accountName: line.account.name,
        lineType: line.lineType,
        budgetAmount,
        actualAmount,
        varianceAmount,
        variancePercent,
        classification,
        isMaterial,
        explanations: line.varianceExplanations,
      });
    }

    return report;
  }

  async addExplanation(data: any, actor?: any): Promise<VarianceExplanation> {
    const userId = actor?.userId || actor?.id;
    const explanation = await this.prisma.varianceExplanation.create({
      data: {
        budgetLine: { connect: { id: data.budgetLineId } },
        accountingPeriod: data.accountingPeriodId
          ? { connect: { id: data.accountingPeriodId } }
          : undefined,
        varianceAmount: data.varianceAmount,
        category: data.category || 'OTHER',
        reason: data.reason,
        comment: data.comment,
        action: data.action,
        owner: data.owner,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_MATERIAL_VARIANCE_DETECTED ??
          'budget.material_variance_detected.v1',
        { budgetLineId: data.budgetLineId, varianceAmount: data.varianceAmount },
        { userId },
      ),
    );

    return explanation;
  }
}
