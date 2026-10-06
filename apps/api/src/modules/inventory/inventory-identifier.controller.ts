import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { toInventoryItemDto, type InventoryItemResponseDto } from '@community-os/contracts';
import { InventoryItemService } from './inventory-item.service.js';

@Controller('inventory/scan')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryIdentifierController {
  constructor(private readonly itemService: InventoryItemService) {}

  @Get(':identifier')
  @RequirePermission(PERMISSIONS.INVENTORY_ITEM_VIEW)
  async resolveScan(@Param('identifier') identifier: string): Promise<InventoryItemResponseDto> {
    const item = await this.itemService.findByIdentifier(identifier);
    if (!item) {
      throw new NotFoundException(`No inventory item matches QR/Barcode '${identifier}'`);
    }
    return toInventoryItemDto(item);
  }
}
