import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PortfolioAnalyticsService } from './portfolio-analytics.service.js';

@Controller('analytics/portfolio')
@UseGuards(AuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioAnalyticsService) {}

  @Get('comparison')
  async getPortfolioComparison(@Query('organizationId') organizationId: string) {
    return this.portfolioService.getPortfolioComparison(organizationId);
  }
}
