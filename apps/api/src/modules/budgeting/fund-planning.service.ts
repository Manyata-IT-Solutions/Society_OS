import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { FundPlan } from '@prisma/client';

@Injectable()
export class FundPlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdatePlan(data: any): Promise<FundPlan> {
    const opening = Number(data.openingAvailable || 0);
    const plannedContrib = Number(data.plannedContribution || 0);
    const plannedUsage = Number(data.plannedUsage || 0);
    const actualContrib = Number(data.actualContribution || 0);
    const actualUsage = Number(data.actualUsage || 0);
    const forecastContrib = Number(data.forecastContribution || plannedContrib);
    const forecastUsage = Number(data.forecastUsage || plannedUsage);
    const projectedClosing = opening + forecastContrib - forecastUsage;

    return this.prisma.fundPlan.upsert({
      where: {
        fundId_fiscalYearId: {
          fundId: data.fundId,
          fiscalYearId: data.fiscalYearId,
        },
      },
      update: {
        openingAvailable: opening,
        plannedContribution: plannedContrib,
        actualContribution: actualContrib,
        plannedUsage,
        actualUsage,
        committedUsage: data.committedUsage || 0,
        forecastContribution: forecastContrib,
        forecastUsage,
        projectedClosing,
        notes: data.notes,
      },
      create: {
        fund: { connect: { id: data.fundId } },
        fiscalYear: { connect: { id: data.fiscalYearId } },
        openingAvailable: opening,
        plannedContribution: plannedContrib,
        actualContribution: actualContrib,
        plannedUsage,
        actualUsage,
        committedUsage: data.committedUsage || 0,
        forecastContribution: forecastContrib,
        forecastUsage,
        projectedClosing,
        notes: data.notes,
      },
      include: { fund: true, fiscalYear: true },
    });
  }

  async listFundPlans(fiscalYearId: string): Promise<FundPlan[]> {
    return this.prisma.fundPlan.findMany({
      where: { fiscalYearId },
      include: { fund: true, fiscalYear: true },
    });
  }
}
