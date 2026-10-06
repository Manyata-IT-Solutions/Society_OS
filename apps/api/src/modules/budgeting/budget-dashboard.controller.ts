import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BudgetDashboardService } from './budget-dashboard.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('budget-dashboard')
@UseGuards(AuthGuard, PermissionGuard)
export class BudgetDashboardController {
  constructor(private readonly dashboardService: BudgetDashboardService) {}

  @Get('kpis')
  @RequirePermission(PERMISSIONS.BUDGET_DASHBOARD_VIEW)
  async getKpis(
    @Query('accountingEntityId') accountingEntityId: string,
    @Query('fiscalYearId') fiscalYearId?: string,
  ) {
    return this.dashboardService.getExecutiveKpis(accountingEntityId, fiscalYearId);
  }

  @Get('spend-pipeline')
  @RequirePermission(PERMISSIONS.BUDGET_DASHBOARD_VIEW)
  async getSpendPipeline(@Query('accountingEntityId') accountingEntityId: string) {
    return this.dashboardService.getSpendPipeline(accountingEntityId);
  }
}
