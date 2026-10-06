import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetSummaryKpis } from '@community-os/types';

@Injectable()
export class BudgetDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveKpis(
    accountingEntityId: string,
    fiscalYearId?: string,
  ): Promise<BudgetSummaryKpis> {
    const activeBudget = await this.prisma.budget.findFirst({
      where: {
        accountingEntityId,
        ...(fiscalYearId ? { fiscalYearId } : {}),
        status: { in: ['ACTIVE', 'APPROVED'] },
      },
      include: { lines: true },
    });

    if (!activeBudget) {
      return {
        totalAnnualBudget: 0,
        currentApprovedBudget: 0,
        actualYtd: 0,
        commitments: 0,
        reservations: 0,
        availableBudget: 0,
        utilizationPercent: 0,
        revenueBudget: 0,
        revenueBilled: 0,
        revenueCollected: 0,
        collectionEfficiencyPercent: 0,
        capexBudget: 0,
        capexActual: 0,
        capexCommitted: 0,
        openExceptionsCount: 0,
        materialVariancesCount: 0,
      };
    }

    const totalAnnual = Number(activeBudget.totalOpex) + Number(activeBudget.totalCapex);
    const currentApproved = activeBudget.lines
      .filter((l) => l.lineType !== 'REVENUE')
      .reduce((sum, l) => sum + Number(l.currentAmount || l.annualAmount), 0);

    // Commitments & Reservations
    const comAgg = await this.prisma.budgetCommitmentEntry.aggregate({
      where: {
        budgetLine: { budgetId: activeBudget.id },
        entryType: 'COMMITMENT',
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });
    const commitments = Number(comAgg._sum.amount || 0);

    const resAgg = await this.prisma.budgetCommitmentEntry.aggregate({
      where: {
        budgetLine: { budgetId: activeBudget.id },
        entryType: 'RESERVATION',
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });
    const reservations = Number(resAgg._sum.amount || 0);

    // Actual from GL
    const actualAgg = await this.prisma.generalLedgerEntry.aggregate({
      where: {
        fiscalYearId: activeBudget.fiscalYearId,
        account: { accountType: 'EXPENSE' },
      },
      _sum: { debitAmount: true, creditAmount: true },
    });
    const debit = Number(actualAgg._sum?.debitAmount || 0);
    const credit = Number(actualAgg._sum?.creditAmount || 0);
    const actualYtd = Math.max(0, debit - credit);

    const availableBudget = currentApproved - actualYtd - commitments - reservations;
    const utilizationPercent = currentApproved > 0 ? (actualYtd / currentApproved) * 100 : 0;

    // Revenue KPIs
    const revLine = activeBudget.lines.find((l) => l.lineType === 'REVENUE');
    const revenueBudget = revLine ? Number(revLine.currentAmount || revLine.annualAmount) : 0;

    // Billed from Phase 14
    const billedAgg = await this.prisma.invoice.aggregate({
      where: { organizationId: activeBudget.organizationId },
      _sum: { grandTotal: true },
    });
    const revenueBilled = Number(billedAgg._sum.grandTotal || 0);

    // Collected from Phase 14
    const collAgg = await this.prisma.payment.aggregate({
      where: { organizationId: activeBudget.organizationId, status: 'SUCCESS' },
      _sum: { receivedAmount: true },
    });
    const revenueCollected = Number(collAgg._sum?.receivedAmount || 0);
    const collectionEfficiencyPercent =
      revenueBilled > 0 ? (revenueCollected / revenueBilled) * 100 : 0;

    // Capex
    const capexAgg = await this.prisma.capexInitiative.aggregate({
      where: { organizationId: activeBudget.organizationId },
      _sum: { approvedBudget: true, actualCost: true, committedCost: true },
    });
    const capexBudget = Number(capexAgg._sum.approvedBudget || 0);
    const capexActual = Number(capexAgg._sum.actualCost || 0);
    const capexCommitted = Number(capexAgg._sum.committedCost || 0);

    return {
      totalAnnualBudget: totalAnnual,
      currentApprovedBudget: currentApproved,
      actualYtd,
      commitments,
      reservations,
      availableBudget,
      utilizationPercent,
      revenueBudget,
      revenueBilled,
      revenueCollected,
      collectionEfficiencyPercent,
      capexBudget,
      capexActual,
      capexCommitted,
      openExceptionsCount: 0,
      materialVariancesCount: 0,
    };
  }

  async getSpendPipeline(accountingEntityId: string): Promise<any> {
    const activeBudget = await this.prisma.budget.findFirst({
      where: { accountingEntityId, status: { in: ['ACTIVE', 'APPROVED'] } },
    });
    if (!activeBudget) return {};

    const budget = Number(activeBudget.totalOpex) + Number(activeBudget.totalCapex);

    const comAgg = await this.prisma.budgetCommitmentEntry.aggregate({
      where: {
        budgetLine: { budgetId: activeBudget.id },
        entryType: 'COMMITMENT',
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });
    const committed = Number(comAgg._sum.amount || 0);

    const resAgg = await this.prisma.budgetCommitmentEntry.aggregate({
      where: {
        budgetLine: { budgetId: activeBudget.id },
        entryType: 'RESERVATION',
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });
    const reserved = Number(resAgg._sum.amount || 0);

    const actualAgg = await this.prisma.generalLedgerEntry.aggregate({
      where: {
        fiscalYearId: activeBudget.fiscalYearId,
        account: { accountType: 'EXPENSE' },
      },
      _sum: { debitAmount: true, creditAmount: true },
    });
    const invoicedActual = Math.max(
      0,
      Number(actualAgg._sum?.debitAmount || 0) - Number(actualAgg._sum?.creditAmount || 0),
    );

    const paidAgg = await this.prisma.vendorPayment.aggregate({
      where: { accountingEntityId, status: 'SUCCESS' },
      _sum: { amount: true },
    });
    const paidCash = Number(paidAgg._sum.amount || 0);

    return {
      budget,
      reserved,
      committed,
      invoicedActual,
      paidCash,
    };
  }
}
