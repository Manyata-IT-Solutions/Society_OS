import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toInventorySerialDto, type InventorySerialResponseDto } from '@community-os/contracts';
import { InventorySerialService } from './inventory-serial.service.js';

@Controller('inventory-serials')
@UseGuards(AuthGuard, PermissionGuard)
export class InventorySerialController {
  constructor(private readonly serialService: InventorySerialService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_SERIAL_VIEW)
  async list(
    @Query('itemId') itemId?: string,
    @Query('currentStoreId') currentStoreId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: InventorySerialResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { serials, total } = await this.serialService.findAll({
      itemId,
      currentStoreId,
      status,
      skip,
      take: limitNum,
    });

    return {
      data: serials.map(toInventorySerialDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_SERIAL_MANAGE)
  async create(
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<InventorySerialResponseDto> {
    const serial = await this.serialService.createSerial(body, actor);
    return toInventorySerialDto(serial);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_SERIAL_VIEW)
  async getById(@Param('id') id: string): Promise<InventorySerialResponseDto> {
    const serial = await this.serialService.findById(id);
    return toInventorySerialDto(serial);
  }

  @Post(':id/convert-to-asset')
  @RequirePermission(PERMISSIONS.INVENTORY_SERIAL_MANAGE)
  async convertToAsset(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<any> {
    const res = await this.serialService.convertToAsset({ ...body, serialId: id }, actor);
    const serialDto = toInventorySerialDto(res.serial);
    return {
      ...serialDto,
      serial: serialDto,
      assetId: res.assetId,
    };
  }
}
