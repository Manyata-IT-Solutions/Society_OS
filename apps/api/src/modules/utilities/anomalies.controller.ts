import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { UtilityAnomalyService } from './utility-anomaly.service.js';

@Controller('utilities/anomalies')
@UseGuards(AuthGuard)
export class UtilityAnomaliesController {
  constructor(private readonly anomalyService: UtilityAnomalyService) {}

  @Post('detect')
  async detectAnomalies(@Body('communityId') communityId: string, @Body('period') period: string) {
    return this.anomalyService.detectAnomalies(communityId, period);
  }

  @Get()
  async listAnomalies(@Query('communityId') communityId: string) {
    return this.anomalyService.listAnomalies(communityId);
  }
}
