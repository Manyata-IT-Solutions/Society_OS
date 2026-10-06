import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  toInventoryItemDto,
  toItemStorePolicyDto,
  type InventoryItemResponseDto,
  type ItemStorePolicyResponseDto,
} from '@community-os/contracts';
import { InventoryItemService } from './inventory-item.service.js';

@Controller('inventory-items')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryItemController {
  constructor(private readonly itemService: InventoryItemService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_ITEM_VIEW)
  async list(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('itemType') itemType?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: InventoryItemResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { items, total } = await this.itemService.findAll({
      organizationId,
      communityId,
      categoryId,
      itemType,
      search,
      skip,
      take: limitNum,
    });

    return {
      data: items.map(toInventoryItemDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_ITEM_MANAGE)
  async create(@Body() body: any, @CurrentActor() actor: Actor): Promise<InventoryItemResponseDto> {
    const item = await this.itemService.createItem(body, actor);
    return toInventoryItemDto(item);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_ITEM_VIEW)
  async getById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    const item = await this.itemService.findById(id);
    return toInventoryItemDto(item);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_ITEM_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryItemResponseDto> {
    const item = await this.itemService.updateItem(id, body, actor);
    return toInventoryItemDto(item);
  }

  @Put(':id/policies/:storeId')
  @RequirePermission(PERMISSIONS.INVENTORY_ITEM_MANAGE)
  async updatePolicy(
    @Param('id') itemId: string,
    @Param('storeId') storeId: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<ItemStorePolicyResponseDto> {
    const policy = await this.itemService.upsertStorePolicy(itemId, storeId, body, actor);
    return toItemStorePolicyDto(policy);
  }
}
