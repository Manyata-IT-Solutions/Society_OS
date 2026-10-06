import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { UtilitiesDashboardService } from './utilities-dashboard.service.js';
import { UtilitiesIntegrityService } from './utilities-integrity.service.js';

@Controller('utilities/dashboard')
@UseGuards(AuthGuard)
export class UtilitiesDashboardController {
  constructor(
    private readonly dashboardService: UtilitiesDashboardService,
    private readonly integrityService: UtilitiesIntegrityService,
  ) {}

  @Get()
  async getDashboardSummary(@Query('communityId') communityId: string) {
    return this.dashboardService.getDashboardSummary(communityId);
  }

  @Get('audit')
  async runIntegrityAudit(@Query('communityId') communityId: string) {
    return this.integrityService.runIntegrityAudit(communityId);
  }
}
