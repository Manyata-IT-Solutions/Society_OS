import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toInventoryBatchDto, type InventoryBatchResponseDto } from '@community-os/contracts';
import { InventoryBatchService } from './inventory-batch.service.js';

@Controller('inventory-batches')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryBatchController {
  constructor(private readonly batchService: InventoryBatchService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_BATCH_VIEW)
  async list(
    @Query('itemId') itemId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: InventoryBatchResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { batches, total } = await this.batchService.findAll({
      itemId,
      status,
      skip,
      take: limitNum,
    });

    return {
      data: batches.map(toInventoryBatchDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_RECEIVE)
  async create(
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryBatchResponseDto> {
    const batch = await this.batchService.createBatch(body, actor);
    return toInventoryBatchDto(batch);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_BATCH_VIEW)
  async getById(@Param('id') id: string): Promise<InventoryBatchResponseDto> {
    const batch = await this.batchService.findById(id);
    return toInventoryBatchDto(batch);
  }
}
