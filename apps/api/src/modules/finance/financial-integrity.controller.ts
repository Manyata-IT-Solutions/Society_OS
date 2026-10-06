import { Controller, Get, Post, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { FinancialIntegrityService } from './financial-integrity.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('finance/integrity')
@UseGuards(AuthGuard, PermissionGuard)
export class FinancialIntegrityController {
  constructor(private readonly integrityService: FinancialIntegrityService) {}

  @Get('audit')
  @RequirePermission(PERMISSIONS.FINANCE_INTEGRITY_VIEW)
  async runAudit(@Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string) {
    const audit = await this.integrityService.runIntegrityAudit(accountingEntityId);
    return audit;
  }

  @Post('rebuild-projections')
  @RequirePermission(PERMISSIONS.FINANCE_INTEGRITY_RUN)
  async rebuildProjections(@Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string) {
    const result = await this.integrityService.rebuildAccountBalancesFromLedger(accountingEntityId);
    return result;
  }
}
