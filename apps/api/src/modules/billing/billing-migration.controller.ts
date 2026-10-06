import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { BillingMigrationService } from './billing-migration.service.js';
import { ImportResidentOpeningBalancesSchema } from '@community-os/validation';

@Controller('billing/migration')
@UseGuards(AuthGuard, PermissionGuard)
export class BillingMigrationController {
  constructor(private readonly migrationService: BillingMigrationService) {}

  @Post('import-opening-balances')
  @RequirePermission(PERMISSIONS.BILLING_IMPORT)
  async importOpeningBalances(@Body() body: unknown) {
    const data = ImportResidentOpeningBalancesSchema.parse(body);
    return this.migrationService.importOpeningBalances(data);
  }
}
