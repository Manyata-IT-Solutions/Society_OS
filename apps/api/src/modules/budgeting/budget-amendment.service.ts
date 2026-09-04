function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetSequenceService } from './budget-sequence.service.js';
import { BudgetBalanceProjectionService } from './budget-balance-projection.service.js';
import { BudgetAmendment } from '@prisma/client';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class BudgetAmendmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: BudgetSequenceService,
    private readonly projectionService: BudgetBalanceProjectionService,
    private readonly eventsService: EventsService,
  ) {}

  async createAmendment(data: any, actor?: any): Promise<BudgetAmendment> {
    const budget = await this.prisma.budget.findUnique({ where: { id: data.budgetId } });
    if (!budget) throw new NotFoundException('Budget not found');

    const amendmentNumber = await this.sequenceService.getNextNumber(
      budget.organizationId,
      'AMENDMENT',
    );
    const userId = actor?.userId || actor?.id;

    let netChange = 0;
    for (const l of data.lines) {
      netChange += Number(l.amountChange);
    }

    const amendment = await this.prisma.budgetAmendment.create({
      data: {
        budget: { connect: { id: budget.id } },
        amendmentNumber,
        reason: data.reason,
        netAmountChange: netChange,
        status: 'APPROVED', // Auto-approved for verified requests
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
        approvedAt: new Date(),
        approvedById: isValidUuid(userId) ? userId : undefined,
        createdById: isValidUuid(userId) ? userId : undefined,
        lines: {
          create: data.lines.map((l: any) => ({
            budgetLine: { connect: { id: l.budgetLineId } },
            amountChange: l.amountChange,
            newAnnualAmount: l.newAnnualAmount,
            reason: l.reason,
          })),
        },
      },
      include: { lines: true },
    });

    // Update actual currentAmount on budget lines
    for (const l of data.lines) {
      await this.prisma.budgetLine.update({
        where: { id: l.budgetLineId },
        data: { currentAmount: l.newAnnualAmount },
      });
    }

    // Recalculate projections
    await this.projectionService.rebuildProjections(budget.id);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_AMENDED ?? 'budget.amended.v1',
        { budgetId: budget.id, amendmentNumber, netChange },
        { organizationId: budget.organizationId, userId },
      ),
    );

    return amendment;
  }

  async listAmendments(budgetId: string): Promise<BudgetAmendment[]> {
    return this.prisma.budgetAmendment.findMany({
      where: { budgetId },
      include: { lines: { include: { budgetLine: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
