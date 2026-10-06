import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { VendorSubledgerService } from './vendor-subledger.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/ledger')
@UseGuards(AuthGuard, PermissionGuard)
export class VendorSubledgerController {
  constructor(private readonly subledgerService: VendorSubledgerService) {}

  @Get(':vendorAccountId')
  @RequirePermission(PERMISSIONS.AP_VENDOR_LEDGER_VIEW)
  async getStatement(@Param('vendorAccountId') vendorAccountId: string) {
    return this.subledgerService.getStatement(vendorAccountId);
  }
}
