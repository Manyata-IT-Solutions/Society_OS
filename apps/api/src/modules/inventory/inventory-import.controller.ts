import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { InventoryImportService } from './inventory-import.service.js';

@Controller('inventory/import')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryImportController {
  constructor(private readonly importService: InventoryImportService) {}

  @Post('preview')
  @RequirePermission(PERMISSIONS.INVENTORY_IMPORT)
  async preview(@Body('organizationId') organizationId: string, @Body('csvData') csvData: string) {
    return this.importService.previewCsv(organizationId, csvData);
  }

  @Post('execute')
  @RequirePermission(PERMISSIONS.INVENTORY_IMPORT)
  async execute(
    @Body('organizationId') organizationId: string,
    @Body('communityId') communityId: string | null,
    @Body('rows') rows: any[],
    @CurrentActor() actor: Actor,
  ) {
    return this.importService.executeImport(organizationId, communityId, rows, actor);
  }
}
