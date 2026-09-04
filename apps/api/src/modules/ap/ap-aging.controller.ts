import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApAgingService } from './ap-aging.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/aging')
@UseGuards(AuthGuard, PermissionGuard)
export class ApAgingController {
  constructor(private readonly agingService: ApAgingService) {}

  @Get()
  @RequirePermission(PERMISSIONS.AP_AGING_VIEW)
  async getAging(
    @Query('accountingEntityId') accountingEntityId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.agingService.getAgingMatrix(accountingEntityId, asOfDate);
  }
}
