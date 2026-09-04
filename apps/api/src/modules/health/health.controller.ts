import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService } from './health.service.js';

@ApiTags('Health & Observability')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'General health check' })
  @ApiResponse({ status: 200, description: 'Application status and uptime' })
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('live')
  @ApiOperation({ summary: 'Kubernetes/Process Liveness Probe' })
  @ApiResponse({ status: 200, description: 'Process is active and accepting requests' })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness Probe verifying infrastructure dependencies' })
  @ApiResponse({ status: 200, description: 'Dependencies are reachable and operational' })
  @ApiResponse({ status: 503, description: 'One or more critical dependencies are unreachable' })
  async getReadiness(@Res({ passthrough: true }) res: Response) {
    const readiness = await this.healthService.getReadiness();
    if (readiness.status === 'unhealthy') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return readiness;
  }
}
