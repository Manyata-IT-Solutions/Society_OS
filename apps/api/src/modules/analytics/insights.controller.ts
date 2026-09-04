import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { InsightAnomalyService } from './insight-anomaly.service.js';
import { RecordAnomalyDto } from '@community-os/contracts';

@Controller('analytics/insights')
@UseGuards(AuthGuard)
export class InsightsController {
  constructor(private readonly insightService: InsightAnomalyService) {}

  @Post('anomalies')
  async recordAnomaly(@Body() dto: RecordAnomalyDto) {
    return this.insightService.recordAnomaly(dto);
  }

  @Get('anomalies')
  async listAnomalies(@Query('communityId') communityId?: string) {
    return this.insightService.listAnomalies(communityId);
  }

  @Get()
  async listInsights(@Query('communityId') communityId?: string) {
    return this.insightService.listInsights(communityId);
  }
}
