import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AnalyticsQueryEngineService } from './analytics-query-engine.service.js';
import { ExecuteAnalyticsQueryDto } from '@community-os/contracts';

@Controller('analytics/query')
@UseGuards(AuthGuard)
export class AnalyticsQueryController {
  constructor(private readonly queryEngine: AnalyticsQueryEngineService) {}

  @Post()
  async executeQuery(@Body() dto: ExecuteAnalyticsQueryDto) {
    return this.queryEngine.executeQuery(dto);
  }
}
