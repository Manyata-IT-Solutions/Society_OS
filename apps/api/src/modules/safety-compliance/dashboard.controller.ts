import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { SafetyDashboardService } from './safety-dashboard.service.js';
import { EmergencyIntegrityService } from './emergency-integrity.service.js';

@Controller('safety/dashboard')
@UseGuards(AuthGuard)
export class SafetyDashboardController {
  constructor(
    private readonly dashService: SafetyDashboardService,
    private readonly integrityService: EmergencyIntegrityService,
  ) {}

  @Get('command-center')
  async getCommandCenterSummary(@Query('communityId') communityId: string) {
    return this.dashService.getCommandCenterSummary(communityId);
  }

  @Get('audit')
  async runAudit(@Query('communityId') communityId: string) {
    return this.integrityService.runIntegrityAudit(communityId);
  }
}
