import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toStockAdjustmentDto, type StockAdjustmentResponseDto } from '@community-os/contracts';
import { StockAdjustmentService } from './stock-adjustment.service.js';

@Controller('stock-adjustments')
@UseGuards(AuthGuard, PermissionGuard)
export class StockAdjustmentController {
  constructor(private readonly adjustmentService: StockAdjustmentService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async list(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('storeId') storeId?: string,
    @Query('reason') reason?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: StockAdjustmentResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { adjustments, total } = await this.adjustmentService.findAll({
      organizationId,
      communityId,
      storeId,
      skip,
      take: limitNum,
    });

    return {
      data: adjustments.map(toStockAdjustmentDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_ADJUST)
  async create(
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<StockAdjustmentResponseDto> {
    const adj = await this.adjustmentService.createAdjustment(body, actor);
    return toStockAdjustmentDto(adj);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getById(@Param('id') id: string): Promise<StockAdjustmentResponseDto> {
    const adj = await this.adjustmentService.findById(id);
    return toStockAdjustmentDto(adj);
  }
}
