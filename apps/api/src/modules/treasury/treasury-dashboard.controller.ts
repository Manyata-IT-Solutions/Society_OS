import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TreasuryDashboardService } from './treasury-dashboard.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('treasury/dashboard')
@UseGuards(AuthGuard, PermissionGuard)
export class TreasuryDashboardController {
  constructor(private readonly dashboardService: TreasuryDashboardService) {}

  @Get()
  @RequirePermission(PERMISSIONS.TREASURY_RECONCILIATION_VIEW)
  async getSummary(@Query('accountingEntityId') accountingEntityId: string) {
    return this.dashboardService.getDashboardSummary(accountingEntityId);
  }
}
