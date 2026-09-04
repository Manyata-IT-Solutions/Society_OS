import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toInventoryReturnDto, type InventoryReturnResponseDto } from '@community-os/contracts';
import { InventoryReturnService } from './inventory-return.service.js';

@Controller('inventory-returns')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryReturnController {
  constructor(private readonly returnService: InventoryReturnService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async list(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('storeId') storeId?: string,
    @Query('workOrderId') workOrderId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{ data: InventoryReturnResponseDto[]; total: number; page: number; limit: number }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { returns, total } = await this.returnService.findAll({
      organizationId,
      communityId,
      storeId,
      workOrderId,
      skip,
      take: limitNum,
    });

    return {
      data: returns.map(toInventoryReturnDto),
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_RETURN)
  async create(
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryReturnResponseDto> {
    const ret = await this.returnService.createReturn(body, actor);
    return toInventoryReturnDto(ret);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getById(@Param('id') id: string): Promise<InventoryReturnResponseDto> {
    const ret = await this.returnService.findById(id);
    return toInventoryReturnDto(ret);
  }
}
