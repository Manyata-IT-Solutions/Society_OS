import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BankStatementImportService } from './bank-statement-import.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('treasury/transactions')
@UseGuards(AuthGuard, PermissionGuard)
export class BankTransactionController {
  constructor(private readonly importService: BankStatementImportService) {}

  @Get()
  @RequirePermission(PERMISSIONS.TREASURY_RECONCILIATION_VIEW)
  async list(@Query('bankAccountId') bankAccountId: string, @Query('status') status?: any) {
    return this.importService.listTransactions(bankAccountId, { status });
  }
}
