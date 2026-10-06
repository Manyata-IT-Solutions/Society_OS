import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApAgingService } from './ap-aging.service.js';
import { ApIntegrityService } from './ap-integrity.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/dashboard')
@UseGuards(AuthGuard, PermissionGuard)
export class ApDashboardController {
  constructor(
    private readonly agingService: ApAgingService,
    private readonly integrityService: ApIntegrityService,
  ) {}

  @Get()
  @RequirePermission(PERMISSIONS.AP_AGING_VIEW)
  async getDashboardSummary(@Query('accountingEntityId') accountingEntityId: string) {
    const aging = await this.agingService.getAgingMatrix(accountingEntityId);
    const integrity = await this.integrityService.reconcileSubledgerWithGl(accountingEntityId);
    return {
      data: {
        aging,
        integrity,
      },
    };
  }
}
