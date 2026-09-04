import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernanceDashboardService } from './governance-dashboard.service.js';
import { GovernanceIntegrityService } from './governance-integrity.service.js';

@Controller('governance/dashboard')
@UseGuards(AuthGuard)
export class GovernanceDashboardController {
  constructor(
    private readonly dashboardService: GovernanceDashboardService,
    private readonly integrityService: GovernanceIntegrityService,
  ) {}

  @Get()
  async getDashboardSummary(@Query('communityId') communityId: string) {
    return this.dashboardService.getDashboardSummary(communityId);
  }

  @Get('audit')
  async runAudit(@Query('communityId') communityId: string) {
    return this.integrityService.runIntegrityAudit(communityId);
  }
}
