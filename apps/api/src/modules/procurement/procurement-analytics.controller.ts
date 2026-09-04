import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProcurementAnalyticsService } from './procurement-analytics.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('procurement/analytics')
@UseGuards(AuthGuard, PermissionGuard)
export class ProcurementAnalyticsController {
  constructor(private readonly analyticsService: ProcurementAnalyticsService) {}

  @Get('kpis')
  @RequirePermission(PERMISSIONS.PROCUREMENT_ANALYTICS_VIEW)
  async getKpis(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
  ) {
    return this.analyticsService.getKpis(organizationId, communityId);
  }
}
