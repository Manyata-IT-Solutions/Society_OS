import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { SustainabilityMetricsService } from './sustainability-metrics.service.js';

@Controller('utilities/sustainability')
@UseGuards(AuthGuard)
export class SustainabilityController {
  constructor(private readonly sustainabilityService: SustainabilityMetricsService) {}

  @Post('calculate')
  async calculateMetrics(
    @Body('communityId') communityId: string,
    @Body('metricPeriod') metricPeriod: string,
  ) {
    return this.sustainabilityService.calculateMonthlyMetrics(communityId, metricPeriod);
  }
}
