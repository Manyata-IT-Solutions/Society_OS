import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ExecutiveCommandCenterService } from './executive-command-center.service.js';

@Controller('analytics/dashboards')
@UseGuards(AuthGuard)
export class DashboardsController {
  constructor(private readonly execService: ExecutiveCommandCenterService) {}

  @Get('executive-overview')
  async getExecutiveOverview(
    @Query('communityId') communityId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.execService.getExecutiveOverview(communityId, organizationId);
  }
}
