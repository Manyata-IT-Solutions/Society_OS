import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SecurityDashboardService } from './security-dashboard.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('security/dashboard')
@UseGuards(AuthGuard)
export class SecurityDashboardController {
  constructor(private readonly service: SecurityDashboardService) {}

  @Get('kpis')
  async getKpis(@Query('communityId') communityId: string) {
    return this.service.getKpis(communityId);
  }

  @Get('active-visits')
  async getActiveVisits(@Query('communityId') communityId: string) {
    return this.service.getActiveVisits(communityId);
  }
}
