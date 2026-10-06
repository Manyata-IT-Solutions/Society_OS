import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProjectFinancialsService } from './project-financials.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('project-dashboard')
@UseGuards(AuthGuard)
export class ProjectDashboardController {
  constructor(private readonly finService: ProjectFinancialsService) {}

  @Get('summary')
  async getFinancialSummary(@Query('projectId') projectId: string) {
    return this.finService.getFinancialSummary(projectId);
  }

  @Get('kpis')
  async getPortfolioKpis(@Query('organizationId') organizationId: string) {
    return this.finService.getPortfolioKpis(organizationId);
  }
}
