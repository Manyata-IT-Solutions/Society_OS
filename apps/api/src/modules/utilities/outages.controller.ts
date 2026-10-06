import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { UtilityOutageService } from './utility-outage.service.js';
import { ReportUtilityOutageDto, RestoreUtilityOutageDto } from '@community-os/contracts';

@Controller('utilities/outages')
@UseGuards(AuthGuard)
export class UtilityOutagesController {
  constructor(private readonly outageService: UtilityOutageService) {}

  @Post()
  async reportOutage(@Body() dto: ReportUtilityOutageDto) {
    return this.outageService.reportOutage(dto);
  }

  @Post('restore')
  async restoreOutage(@Body() dto: RestoreUtilityOutageDto) {
    return this.outageService.restoreOutage(dto);
  }

  @Get()
  async listOutages(@Query('communityId') communityId: string) {
    return this.outageService.listOutages(communityId);
  }
}
