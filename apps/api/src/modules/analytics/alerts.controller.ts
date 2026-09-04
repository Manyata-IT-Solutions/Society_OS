import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ExecutiveAlertCenterService } from './executive-alert-center.service.js';
import { CreateExecutiveAlertDto } from '@community-os/contracts';

@Controller('analytics/alerts')
@UseGuards(AuthGuard)
export class AlertsController {
  constructor(private readonly alertService: ExecutiveAlertCenterService) {}

  @Post()
  async createAlert(@Body() dto: CreateExecutiveAlertDto) {
    return this.alertService.createAlert(dto);
  }

  @Post('acknowledge/:id')
  async acknowledgeAlert(@Param('id') id: string) {
    return this.alertService.acknowledgeAlert(id);
  }

  @Get()
  async listAlerts(@Query('communityId') communityId?: string, @Query('status') status?: string) {
    return this.alertService.listAlerts(communityId, status);
  }
}
