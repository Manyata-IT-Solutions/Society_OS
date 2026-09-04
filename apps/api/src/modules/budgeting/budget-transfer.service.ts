function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetSequenceService } from './budget-sequence.service.js';
import { BudgetBalanceProjectionService } from './budget-balance-projection.service.js';
import { BudgetTransfer } from '@prisma/client';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class BudgetTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: BudgetSequenceService,
    private readonly projectionService: BudgetBalanceProjectionService,
    private readonly eventsService: EventsService,
  ) {}

  async createTransfer(data: any, actor?: any): Promise<BudgetTransfer> {
    const sourceLine = await this.prisma.budgetLine.findUnique({
      where: { id: data.sourceBudgetLineId },
      include: { budget: true },
    });
    const destLine = await this.prisma.budgetLine.findUnique({
      where: { id: data.destinationBudgetLineId },
      include: { budget: true },
    });

    if (!sourceLine || !destLine)
      throw new NotFoundException('Source or destination budget line not found');
    if (sourceLine.id === destLine.id)
      throw new BadRequestException('Cannot transfer budget to the same line');

    // Fund isolation rule: Cannot transfer across different ring-fenced funds unless unrestricted
    if (sourceLine.fundId && destLine.fundId && sourceLine.fundId !== destLine.fundId) {
      throw new BadRequestException(
        'Cross-Fund transfer not allowed between different restricted funds',
      );
    }

    const amount = Number(data.amount);
    const sourceAvailable = Number(sourceLine.currentAmount || sourceLine.annualAmount);
    if (amount > sourceAvailable) {
      throw new BadRequestException(
        `Transfer amount (${amount}) exceeds source line budget (${sourceAvailable})`,
      );
    }

    const transferNumber = await this.sequenceService.getNextNumber(
      sourceLine.budget.organizationId,
      'TRANSFER',
    );
    const userId = actor?.userId || actor?.id;

    const transfer = await this.prisma.budgetTransfer.create({
      data: {
        transferNumber,
        sourceBudgetLine: { connect: { id: sourceLine.id } },
        destinationBudgetLine: { connect: { id: destLine.id } },
        amount,
        reason: data.reason,
        status: 'POSTED',
        effectiveDate: new Date(),
        approvedAt: new Date(),
        approvedById: isValidUuid(userId) ? userId : undefined,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    // Update lines currentAmount
    await this.prisma.budgetLine.update({
      where: { id: sourceLine.id },
      data: { currentAmount: sourceAvailable - amount },
    });

    const destAvailable = Number(destLine.currentAmount || destLine.annualAmount);
    await this.prisma.budgetLine.update({
      where: { id: destLine.id },
      data: { currentAmount: destAvailable + amount },
    });

    await this.projectionService.rebuildProjections(sourceLine.budgetId);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_TRANSFER_APPROVED ?? 'budget.transfer_approved.v1',
        { transferNumber, sourceLineId: sourceLine.id, destLineId: destLine.id, amount },
        { organizationId: sourceLine.budget.organizationId, userId },
      ),
    );

    return transfer;
  }

  async listTransfers(budgetLineId: string): Promise<BudgetTransfer[]> {
    return this.prisma.budgetTransfer.findMany({
      where: {
        OR: [{ sourceBudgetLineId: budgetLineId }, { destinationBudgetLineId: budgetLineId }],
      },
      include: { sourceBudgetLine: true, destinationBudgetLine: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
