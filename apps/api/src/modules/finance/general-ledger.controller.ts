import { Controller, Get, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { GeneralLedgerService } from './general-ledger.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('finance/ledger')
@UseGuards(AuthGuard, PermissionGuard)
export class GeneralLedgerController {
  constructor(private readonly glService: GeneralLedgerService) {}

  @Get('entries')
  @RequirePermission(PERMISSIONS.FINANCE_LEDGER_VIEW)
  async getGeneralLedger(
    @Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string,
    @Query('fiscalYearId') fiscalYearId?: string,
    @Query('periodId') periodId?: string,
    @Query('accountId') accountId?: string,
    @Query('fundId') fundId?: string,
    @Query('costCenterId') costCenterId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const result = await this.glService.getGeneralLedger({
      accountingEntityId,
      fiscalYearId,
      periodId,
      accountId,
      fundId,
      costCenterId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
    return result.items;
  }

  @Get('account')
  @RequirePermission(PERMISSIONS.FINANCE_LEDGER_VIEW)
  async getAccountLedger(
    @Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string,
    @Query('accountId', ParseUUIDPipe) accountId: string,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    const report = await this.glService.getAccountLedger(
      accountingEntityId,
      accountId,
      startDate,
      endDate,
    );
    return report;
  }
}
