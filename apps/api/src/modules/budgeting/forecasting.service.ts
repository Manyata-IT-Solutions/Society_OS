function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Forecast } from '@prisma/client';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class ForecastingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async generateForecast(data: any, actor?: any): Promise<Forecast> {
    const userId = actor?.userId || actor?.id;
    const count = await this.prisma.forecast.count({
      where: { accountingEntityId: data.accountingEntityId, fiscalYearId: data.fiscalYearId },
    });

    const forecast = await this.prisma.forecast.create({
      data: {
        accountingEntity: { connect: { id: data.accountingEntityId } },
        fiscalYear: { connect: { id: data.fiscalYearId } },
        name: data.name,
        forecastType: data.forecastType || 'LATEST_ESTIMATE',
        asOfDate: data.asOfDate ? new Date(data.asOfDate) : new Date(),
        status: 'APPROVED',
        versionNumber: count + 1,
        scenario: data.scenario || 'BASE',
        notes: data.notes,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    // Populate lines from active budget
    const activeBudget = await this.prisma.budget.findFirst({
      where: {
        accountingEntityId: data.accountingEntityId,
        fiscalYearId: data.fiscalYearId,
        status: { in: ['ACTIVE', 'APPROVED'] },
      },
      include: { lines: true },
    });

    if (activeBudget && activeBudget.lines) {
      let idx = 1;
      for (const bl of activeBudget.lines) {
        // 1. Get Actual to Date from GL
        const actualAgg = await this.prisma.generalLedgerEntry.aggregate({
          where: { accountId: bl.accountId, fiscalYearId: data.fiscalYearId },
          _sum: { debitAmount: true, creditAmount: true },
        });
        const debit = Number(actualAgg._sum?.debitAmount || 0);
        const credit = Number(actualAgg._sum?.creditAmount || 0);
        const actualToDate =
          bl.lineType === 'REVENUE' ? Math.max(0, credit - debit) : Math.max(0, debit - credit);

        // 2. Commitments
        const comAgg = await this.prisma.budgetCommitmentEntry.aggregate({
          where: { budgetLineId: bl.id, entryType: 'COMMITMENT', status: 'ACTIVE' },
          _sum: { amount: true },
        });
        const openCommitment = Number(comAgg._sum.amount || 0);

        const method = data.method || 'COMMITMENT_AWARE';
        const annualBudget = Number(bl.currentAmount || bl.annualAmount);

        let forecastRemaining = 0;
        if (method === 'RUN_RATE') {
          forecastRemaining = actualToDate > 0 ? actualToDate : annualBudget / 2;
        } else if (method === 'COMMITMENT_AWARE') {
          forecastRemaining = Math.max(openCommitment, annualBudget - actualToDate);
        } else {
          forecastRemaining = Math.max(0, annualBudget - actualToDate);
        }

        const forecastFullYear = actualToDate + forecastRemaining;

        await this.prisma.forecastLine.create({
          data: {
            forecast: { connect: { id: forecast.id } },
            lineNumber: idx++,
            account: { connect: { id: bl.accountId } },
            fund: bl.fundId ? { connect: { id: bl.fundId } } : undefined,
            costCenter: bl.costCenterId ? { connect: { id: bl.costCenterId } } : undefined,
            actualToDate,
            forecastRemaining,
            forecastFullYear,
            method,
          },
        });
      }
    }

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_FORECAST_CREATED ?? 'budget.forecast_created.v1',
        { forecastId: forecast.id, versionNumber: forecast.versionNumber },
        { userId },
      ),
    );

    return this.prisma.forecast.findUnique({
      where: { id: forecast.id },
      include: { lines: { include: { account: true, fund: true, costCenter: true } } },
    }) as any;
  }

  async listForecasts(accountingEntityId: string, fiscalYearId?: string): Promise<Forecast[]> {
    const where: any = { accountingEntityId };
    if (fiscalYearId) where.fiscalYearId = fiscalYearId;
    return this.prisma.forecast.findMany({
      where,
      include: { lines: { include: { account: true, fund: true, costCenter: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
