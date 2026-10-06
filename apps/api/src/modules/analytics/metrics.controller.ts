import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { MetricRegistryService } from './metric-registry.service.js';
import { CreateMetricDefinitionDto, CreateMetricTargetDto } from '@community-os/contracts';

@Controller('analytics/metrics')
@UseGuards(AuthGuard)
export class MetricsController {
  constructor(private readonly metricService: MetricRegistryService) {}

  @Post()
  async registerMetric(@Body() dto: CreateMetricDefinitionDto) {
    return this.metricService.registerMetric(dto);
  }

  @Post('targets')
  async setTarget(@Body() dto: CreateMetricTargetDto) {
    return this.metricService.setTarget(dto);
  }

  @Get(':metricKey')
  async getMetric(@Param('metricKey') metricKey: string) {
    return this.metricService.getMetric(metricKey);
  }

  @Get()
  async listMetrics(@Query('domain') domain?: string) {
    return this.metricService.listMetrics(domain);
  }
}
