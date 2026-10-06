import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { ResidentAccountRepository } from './resident-account.repository.js';
import {
  toResidentLedgerEntryResponseDto,
  ResidentLedgerEntryResponseDto,
} from '@community-os/contracts';

@Controller('billing/ledger')
@UseGuards(AuthGuard, PermissionGuard)
export class ResidentLedgerController {
  constructor(private readonly accountRepo: ResidentAccountRepository) {}

  @Get(':billableAccountId')
  @RequirePermission(PERMISSIONS.BILLING_RESIDENT_LEDGER_VIEW)
  async getLedger(
    @Param('billableAccountId') billableAccountId: string,
  ): Promise<ResidentLedgerEntryResponseDto[]> {
    const account = await this.accountRepo.findByBillableAccountId(billableAccountId);
    if (!account) return [];
    const [items] = await this.accountRepo.listLedgerEntries({ residentAccountId: account.id });
    return items.map(toResidentLedgerEntryResponseDto);
  }
}
