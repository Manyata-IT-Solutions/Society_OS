import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { AgingCollectionService } from './aging-collection.service.js';
import { PenaltyInterestService } from './penalty-interest.service.js';

@Controller('billing/analytics')
@UseGuards(AuthGuard, PermissionGuard)
export class AgingCollectionController {
  constructor(
    private readonly agingService: AgingCollectionService,
    private readonly penaltyService: PenaltyInterestService,
  ) {}

  @Get('aging')
  @RequirePermission(PERMISSIONS.BILLING_AGING_VIEW)
  async getAging(@Query('communityId') communityId: string) {
    return this.agingService.getAgingMatrix(communityId);
  }

  @Get('dashboard')
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async getDashboard(@Query('communityId') communityId: string) {
    return this.agingService.getDashboardKpis(communityId);
  }

  @Post('penalties/sweep')
  @RequirePermission(PERMISSIONS.BILLING_MANAGE)
  async runPenaltySweep(@Query('communityId') communityId: string) {
    return this.penaltyService.runPenaltySweep(communityId);
  }
}
