import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  toInventoryStoreDto,
  toStockBinDto,
  type InventoryStoreResponseDto,
  type StockBinResponseDto,
} from '@community-os/contracts';
import { InventoryStoreService } from './inventory-store.service.js';

@Controller('inventory-stores')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryStoreController {
  constructor(private readonly storeService: InventoryStoreService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_STORE_VIEW)
  async listStores(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
  ): Promise<InventoryStoreResponseDto[]> {
    const stores = await this.storeService.findAllStores(organizationId, communityId);
    return stores.map(toInventoryStoreDto);
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_STORE_MANAGE)
  async createStore(
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryStoreResponseDto> {
    const store = await this.storeService.createStore(body, actor);
    return toInventoryStoreDto(store);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_STORE_VIEW)
  async getStoreById(@Param('id') id: string): Promise<InventoryStoreResponseDto> {
    const store = await this.storeService.findStoreById(id);
    return toInventoryStoreDto(store);
  }

  @Get(':id/bins')
  @RequirePermission(PERMISSIONS.INVENTORY_STORE_VIEW)
  async listBins(@Param('id') storeId: string): Promise<StockBinResponseDto[]> {
    const bins = await this.storeService.findAllBins(storeId);
    return bins.map(toStockBinDto);
  }

  @Post(':id/bins')
  @RequirePermission(PERMISSIONS.INVENTORY_STORE_MANAGE)
  async createBin(
    @Param('id') storeId: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<StockBinResponseDto> {
    const bin = await this.storeService.createBin({ ...body, storeId }, actor);
    return toStockBinDto(bin);
  }
}
