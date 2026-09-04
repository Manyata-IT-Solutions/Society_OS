import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { HazardRiskService } from './hazard-risk.service.js';
import { ReportSafetyHazardDto, AssessSafetyRiskDto } from '@community-os/contracts';

@Controller('safety/hazards-risks')
@UseGuards(AuthGuard)
export class HazardsRisksController {
  constructor(private readonly hrService: HazardRiskService) {}

  @Post('hazards')
  async reportHazard(@Body() dto: ReportSafetyHazardDto) {
    return this.hrService.reportHazard(dto);
  }

  @Post('risks')
  async assessRisk(@Body() dto: AssessSafetyRiskDto) {
    return this.hrService.assessRisk(dto);
  }

  @Get('risks')
  async listRisks(@Query('communityId') communityId: string) {
    return this.hrService.listRisks(communityId);
  }
}
