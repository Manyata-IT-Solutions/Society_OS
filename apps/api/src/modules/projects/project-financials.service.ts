import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ProjectFinancialsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancialSummary(projectId: string) {
    const summary = await this.prisma.projectFinancialSummary.findUnique({
      where: { projectId },
      include: { project: true },
    });
    if (!summary) throw new NotFoundException('Financial Summary not found');
    return summary;
  }

  async getPortfolioKpis(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      include: { financialSummary: true },
    });

    let totalBudget = 0;
    let totalCommitted = 0;
    let totalActual = 0;
    let totalPaid = 0;
    let totalForecast = 0;
    let totalAvailable = 0;

    projects.forEach((p) => {
      if (p.financialSummary) {
        totalBudget += Number(p.financialSummary.approvedBudget);
        totalCommitted += Number(p.financialSummary.committed);
        totalActual += Number(p.financialSummary.actualGl);
        totalPaid += Number(p.financialSummary.paid);
        totalForecast += Number(p.financialSummary.forecastFinalCost);
        totalAvailable += Number(p.financialSummary.availableBudget);
      }
    });

    const activeCount = projects.filter(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'APPROVED',
    ).length;
    const completedCount = projects.filter(
      (p) => p.status === 'COMPLETED' || p.status === 'CLOSED',
    ).length;
    const delayedCount = projects.filter((p) => p.status === 'DELAYED').length;

    return {
      totalProjectsCount: projects.length,
      activeProjectsCount: activeCount,
      completedProjectsCount: completedCount,
      delayedProjectsCount: delayedCount,
      totalApprovedBudget: totalBudget,
      totalCommitted,
      totalActualSpend: totalActual,
      totalPaid,
      totalForecastFinalCost: totalForecast,
      totalAvailableBudget: totalAvailable,
    };
  }
}
