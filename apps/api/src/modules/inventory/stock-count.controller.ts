import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toStockCountDto, type StockCountResponseDto } from '@community-os/contracts';
import { StockCountService } from './stock-count.service.js';

@Controller('stock-counts')
@UseGuards(AuthGuard, PermissionGuard)
export class StockCountController {
  constructor(private readonly countService: StockCountService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async list(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: StockCountResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { counts, total } = await this.countService.findAll({
      organizationId,
      communityId,
      storeId,
      status,
      skip,
      take: limitNum,
    });

    return {
      data: counts.map(toStockCountDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_COUNT)
  async create(@Body() body: any, @CurrentActor() actor: Actor): Promise<StockCountResponseDto> {
    const count = await this.countService.createStockCount(body, actor);
    return toStockCountDto(count);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getById(@Param('id') id: string): Promise<StockCountResponseDto> {
    const count = await this.countService.findById(id);
    return toStockCountDto(count);
  }

  @Post(':id/record')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_COUNT)
  async record(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<StockCountResponseDto> {
    const lines = Array.isArray(body) ? body : body?.lines || [];
    const count = await this.countService.recordLines(id, lines, actor);
    return toStockCountDto(count);
  }

  @Post(':id/reconcile')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_RECONCILE)
  async reconcile(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<StockCountResponseDto> {
    const count = await this.countService.postReconciliation(id, actor);
    return toStockCountDto(count);
  }
}
