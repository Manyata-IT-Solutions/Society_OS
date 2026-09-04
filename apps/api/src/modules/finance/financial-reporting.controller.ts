import { Controller, Get, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { FinancialReportingService } from './financial-reporting.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('finance/reports')
@UseGuards(AuthGuard, PermissionGuard)
export class FinancialReportingController {
  constructor(private readonly repService: FinancialReportingService) {}

  @Get('trial-balance')
  @RequirePermission(PERMISSIONS.FINANCE_TRIAL_BALANCE_VIEW)
  async getTrialBalance(
    @Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const tb = await this.repService.getTrialBalance(accountingEntityId, asOfDate);
    return tb;
  }

  @Get('balance-sheet')
  @RequirePermission(PERMISSIONS.FINANCE_STATEMENT_VIEW)
  async getBalanceSheet(
    @Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const bs = await this.repService.getBalanceSheet(accountingEntityId, asOfDate);
    return bs;
  }

  @Get('income-expenditure')
  @RequirePermission(PERMISSIONS.FINANCE_STATEMENT_VIEW)
  async getIncomeExpenditure(
    @Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const ie = await this.repService.getIncomeExpenditure(accountingEntityId, startDate, endDate);
    return ie;
  }

  @Get('dashboard')
  @RequirePermission(PERMISSIONS.FINANCE_STATEMENT_VIEW)
  async getDashboard(@Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string) {
    const kpis = await this.repService.getDashboardKpis(accountingEntityId);
    return kpis;
  }
}
