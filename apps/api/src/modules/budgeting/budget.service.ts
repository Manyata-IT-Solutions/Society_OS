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
import { Budget } from '@prisma/client';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: BudgetSequenceService,
    private readonly projectionService: BudgetBalanceProjectionService,
    private readonly eventsService: EventsService,
  ) {}

  async createBudget(data: any, actor?: any): Promise<Budget> {
    const budgetNumber = await this.sequenceService.getNextNumber(data.organizationId, 'BUDGET');
    const userId = actor?.userId || actor?.id;

    const fy = await this.prisma.fiscalYear.findUnique({
      where: { id: data.fiscalYearId },
      include: { periods: true },
    });
    if (!fy) throw new NotFoundException('Fiscal year not found');

    const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : fy.startDate;
    const effectiveTo = data.effectiveTo ? new Date(data.effectiveTo) : fy.endDate;

    const budget = await this.prisma.budget.create({
      data: {
        organization: { connect: { id: data.organizationId } },
        accountingEntity: { connect: { id: data.accountingEntityId } },
        community: data.communityId ? { connect: { id: data.communityId } } : undefined,
        fiscalYear: { connect: { id: data.fiscalYearId } },
        parentBudget: data.parentBudgetId ? { connect: { id: data.parentBudgetId } } : undefined,
        template: data.templateId ? { connect: { id: data.templateId } } : undefined,
        budgetNumber,
        name: data.name,
        description: data.description,
        budgetType: data.budgetType || 'OPERATING',
        scenarioType: data.scenarioType || 'BASE',
        status: 'DRAFT',
        currency: data.currency || 'INR',
        effectiveFrom,
        effectiveTo,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    // Populate lines if provided
    if (data.lines && data.lines.length > 0) {
      let lineNum = 1;
      let totalRev = 0;
      let totalOpex = 0;
      let totalCapex = 0;

      for (const l of data.lines) {
        const annualAmount = Number(l.annualAmount);
        const lType = l.lineType || 'OPEX';
        if (lType === 'REVENUE') totalRev += annualAmount;
        else if (lType === 'CAPEX') totalCapex += annualAmount;
        else totalOpex += annualAmount;

        const line = await this.prisma.budgetLine.create({
          data: {
            budget: { connect: { id: budget.id } },
            lineNumber: l.lineNumber || lineNum++,
            account: { connect: { id: l.accountId } },
            fund: l.fundId ? { connect: { id: l.fundId } } : undefined,
            costCenter: l.costCenterId ? { connect: { id: l.costCenterId } } : undefined,
            community: l.communityId ? { connect: { id: l.communityId } } : undefined,
            capexInitiative: l.capexInitiativeId
              ? { connect: { id: l.capexInitiativeId } }
              : undefined,
            lineType: lType,
            description: l.description,
            annualAmount,
            currentAmount: annualAmount,
            allocationMethod: l.allocationMethod || 'EQUAL',
            notes: l.notes,
          },
        });

        // Period allocations
        if (l.periodAllocations && l.periodAllocations.length > 0) {
          for (const pa of l.periodAllocations) {
            await this.prisma.budgetPeriodAllocation.create({
              data: {
                budgetLine: { connect: { id: line.id } },
                accountingPeriod: { connect: { id: pa.accountingPeriodId } },
                amount: pa.amount,
                allocationMethod: pa.allocationMethod || 'MANUAL',
              },
            });
          }
        } else if (fy.periods && fy.periods.length > 0) {
          // Spread equally
          const monthlyAmount = annualAmount / fy.periods.length;
          for (const p of fy.periods) {
            await this.prisma.budgetPeriodAllocation.create({
              data: {
                budgetLine: { connect: { id: line.id } },
                accountingPeriod: { connect: { id: p.id } },
                amount: monthlyAmount,
                allocationMethod: 'EQUAL',
              },
            });
          }
        }
      }

      await this.prisma.budget.update({
        where: { id: budget.id },
        data: {
          totalRevenue: totalRev,
          totalOpex,
          totalCapex,
          totalNetBudget: totalRev - totalOpex - totalCapex,
        },
      });
    }

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_CREATED ?? 'budget.created.v1',
        { budgetId: budget.id, budgetNumber },
        { organizationId: data.organizationId, userId },
      ),
    );

    return this.getBudget(budget.id);
  }

  async getBudget(id: string): Promise<Budget> {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: true,
            fund: true,
            costCenter: true,
            periodAllocations: { include: { accountingPeriod: true } },
            balanceProjections: true,
          },
          orderBy: { lineNumber: 'asc' },
        },
        fiscalYear: { include: { periods: true } },
        community: true,
      },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async listBudgets(accountingEntityId: string, fiscalYearId?: string): Promise<Budget[]> {
    const where: any = { accountingEntityId };
    if (fiscalYearId) where.fiscalYearId = fiscalYearId;
    return this.prisma.budget.findMany({
      where,
      include: { fiscalYear: true, community: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitBudget(id: string, actor?: any): Promise<Budget> {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.status !== 'DRAFT' && budget.status !== 'IN_PREPARATION') {
      throw new BadRequestException('Only draft budgets can be submitted');
    }

    const userId = actor?.userId || actor?.id;
    const updated = await this.prisma.budget.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedById: isValidUuid(userId) ? userId : undefined,
      },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_SUBMITTED ?? 'budget.submitted.v1',
        { budgetId: id, budgetNumber: budget.budgetNumber },
        { organizationId: budget.organizationId, userId },
      ),
    );

    return updated;
  }

  async approveBudget(id: string, actor?: any): Promise<Budget> {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (
      budget.status !== 'SUBMITTED' &&
      budget.status !== 'UNDER_REVIEW' &&
      budget.status !== 'DRAFT'
    ) {
      throw new BadRequestException('Budget cannot be approved in its current state');
    }

    const userId = actor?.userId || actor?.id;
    const updated = await this.prisma.budget.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: isValidUuid(userId) ? userId : undefined,
      },
    });

    // Generate initial projections
    await this.projectionService.rebuildProjections(id);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_APPROVED ?? 'budget.approved.v1',
        { budgetId: id, budgetNumber: budget.budgetNumber },
        { organizationId: budget.organizationId, userId },
      ),
    );

    return updated;
  }

  async activateBudget(id: string, actor?: any): Promise<Budget> {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.status !== 'APPROVED') {
      throw new BadRequestException('Only approved budgets can be activated');
    }

    // Set other active budgets for this entity & FY to SUPERSEDED
    await this.prisma.budget.updateMany({
      where: {
        accountingEntityId: budget.accountingEntityId,
        fiscalYearId: budget.fiscalYearId,
        status: 'ACTIVE',
        id: { not: id },
      },
      data: { status: 'SUPERSEDED' },
    });

    const updated = await this.prisma.budget.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.projectionService.rebuildProjections(id);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_ACTIVATED ?? 'budget.activated.v1',
        { budgetId: id, budgetNumber: budget.budgetNumber },
        { organizationId: budget.organizationId, userId: actor?.userId },
      ),
    );

    return updated;
  }

  async copyPriorYear(params: {
    sourceBudgetId: string;
    targetFiscalYearId: string;
    name: string;
    percentageUplift?: number;
    actor?: any;
  }): Promise<Budget> {
    const source = await this.prisma.budget.findUnique({
      where: { id: params.sourceBudgetId },
      include: { lines: { include: { periodAllocations: true } } },
    });
    if (!source) throw new NotFoundException('Source budget not found');

    const targetFy = await this.prisma.fiscalYear.findUnique({
      where: { id: params.targetFiscalYearId },
      include: { periods: true },
    });
    if (!targetFy) throw new NotFoundException('Target fiscal year not found');

    const upliftMultiplier = 1 + Number(params.percentageUplift || 0) / 100;

    const mappedLines = source.lines.map((l) => ({
      lineNumber: l.lineNumber,
      accountId: l.accountId,
      fundId: l.fundId,
      costCenterId: l.costCenterId,
      communityId: l.communityId,
      lineType: l.lineType,
      description: l.description,
      annualAmount: Math.round(Number(l.annualAmount) * upliftMultiplier),
      allocationMethod: l.allocationMethod,
    }));

    return this.createBudget(
      {
        organizationId: source.organizationId,
        accountingEntityId: source.accountingEntityId,
        communityId: source.communityId,
        fiscalYearId: params.targetFiscalYearId,
        name: params.name,
        description: `Copy of ${source.name} with ${params.percentageUplift || 0}% uplift`,
        budgetType: source.budgetType,
        scenarioType: source.scenarioType,
        currency: source.currency,
        effectiveFrom: targetFy.startDate,
        effectiveTo: targetFy.endDate,
        lines: mappedLines,
      },
      params.actor,
    );
  }
}
