function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetResolverService } from './budget-resolver.service.js';
import { BudgetCommitmentService } from './budget-commitment.service.js';
import {
  BudgetControlCheckRequest,
  BudgetControlCheckResult,
  BudgetControlMode,
} from '@community-os/types';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class BudgetControlEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: BudgetResolverService,
    private readonly commitmentService: BudgetCommitmentService,
    private readonly eventsService: EventsService,
  ) {}

  async checkBudget(req: BudgetControlCheckRequest): Promise<BudgetControlCheckResult> {
    const budgetLine = await this.resolver.resolveBudgetLine({
      accountingEntityId: req.accountingEntityId,
      communityId: req.communityId,
      accountId: req.accountId,
      fundId: req.fundId,
      costCenterId: req.costCenterId,
      capexInitiativeId: req.capexInitiativeId,
      date: req.date,
    });

    if (!budgetLine) {
      return {
        decision: 'NOT_APPLICABLE',
        controlMode: 'OFF',
        currentApprovedBudget: 0,
        actualYtd: 0,
        commitments: 0,
        reservations: 0,
        availableBudget: 0,
        requestedAmount: req.amount,
        projectedAvailable: 0,
        shortfall: 0,
        reason: 'No applicable active budget line found for this dimension context',
        approvalRequired: false,
      };
    }

    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetLine.budgetId },
    });

    // Determine configured control mode
    const controlMode: BudgetControlMode = 'HARD'; // Default HARD control

    // 1. Calculate Current Approved Budget
    const currentApprovedBudget = Number(budgetLine.currentAmount || budgetLine.annualAmount);

    // 2. Calculate Actual Spend from Phase 13 General Ledger
    const actualAgg = await this.prisma.generalLedgerEntry.aggregate({
      where: {
        accountId: budgetLine.accountId,
        fiscalYearId: budget!.fiscalYearId,
      },
      _sum: { debitAmount: true, creditAmount: true },
    });
    const totalDebit = Number(actualAgg._sum?.debitAmount || 0);
    const totalCredit = Number(actualAgg._sum?.creditAmount || 0);
    // For expense account, Actual = Debit - Credit
    const actualYtd = Math.max(0, totalDebit - totalCredit);

    // 3. Calculate Commitments & Reservations from Append-Only Ledger
    const commitmentsAgg = await this.prisma.budgetCommitmentEntry.aggregate({
      where: {
        budgetLineId: budgetLine.id,
        entryType: { in: ['COMMITMENT', 'COMMITMENT_ADJUSTMENT'] },
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });
    const commitments = Number(commitmentsAgg._sum.amount || 0);

    const reservationsAgg = await this.prisma.budgetCommitmentEntry.aggregate({
      where: {
        budgetLineId: budgetLine.id,
        entryType: 'RESERVATION',
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });
    const reservations = Number(reservationsAgg._sum.amount || 0);

    // 4. Calculate Available Budget Formula
    // Available = Current Approved Budget - Actual - Commitments - Reservations
    const availableBudget = currentApprovedBudget - actualYtd - commitments - reservations;
    const requestedAmount = Number(req.amount);
    const projectedAvailable = availableBudget - requestedAmount;
    const shortfall = requestedAmount > availableBudget ? requestedAmount - availableBudget : 0;

    let decision: any = 'ALLOWED';
    let approvalRequired = false;
    let reason = 'Budget available for spend request';

    if (shortfall > 0) {
      if (controlMode === 'HARD') {
        decision = 'BLOCKED';
        approvalRequired = true;
        reason = `Requested amount (${requestedAmount}) exceeds available budget (${availableBudget}). Shortfall: ${shortfall}`;

        // Emit block event
        this.eventsService.publish(
          createEvent(
            (DOMAIN_EVENTS as any).BUDGET_CONTROL_BLOCKED ?? 'budget.control_blocked.v1',
            { budgetLineId: budgetLine.id, requestedAmount, availableBudget, shortfall },
            { organizationId: req.organizationId },
          ),
        );
      } else if (controlMode === 'SOFT') {
        decision = 'ALLOWED_WITH_WARNING';
        approvalRequired = true;
        reason = `Requested spend exceeds available budget. Soft warning generated for shortfall ${shortfall}`;
      }
    }

    return {
      decision,
      budgetLineId: budgetLine.id,
      budgetId: budget!.id,
      budgetNumber: budget!.budgetNumber,
      controlMode,
      currentApprovedBudget,
      actualYtd,
      commitments,
      reservations,
      availableBudget,
      requestedAmount,
      projectedAvailable,
      shortfall,
      reason,
      approvalRequired,
    };
  }

  // Atomic Check and Create Reservation / Commitment with DB transaction
  async executeSpendControl(
    req: BudgetControlCheckRequest & { reference?: string; notes?: string },
    actor?: any,
  ): Promise<BudgetControlCheckResult> {
    return this.prisma.$transaction(async (tx) => {
      const budgetLine = await this.resolver.resolveBudgetLine({
        accountingEntityId: req.accountingEntityId,
        communityId: req.communityId,
        accountId: req.accountId,
        fundId: req.fundId,
        costCenterId: req.costCenterId,
        capexInitiativeId: req.capexInitiativeId,
        date: req.date,
      });

      if (!budgetLine) {
        throw new BadRequestException('No active budget line found for this spend context');
      }

      const check = await this.checkBudget(req);
      if (check.decision === 'BLOCKED') {
        throw new BadRequestException(`Budget Control Blocked: ${check.reason}`);
      }

      const userId = actor?.userId || actor?.id;
      const entryType = req.sourceType === 'PURCHASE_REQUISITION' ? 'RESERVATION' : 'COMMITMENT';

      await tx.budgetCommitmentEntry.create({
        data: {
          budgetLine: { connect: { id: budgetLine.id } },
          sourceType: req.sourceType,
          sourceId: req.sourceId || budgetLine.id,
          entryType,
          amount: req.amount,
          entryDate: req.date ? new Date(req.date) : new Date(),
          status: 'ACTIVE',
          reference: req.reference,
          notes: req.notes,
          createdById: isValidUuid(userId) ? userId : undefined,
        },
      });

      return check;
    });
  }
}
