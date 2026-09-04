import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toStockTransferDto, type StockTransferResponseDto } from '@community-os/contracts';
import { StockTransferService } from './stock-transfer.service.js';

@Controller('stock-transfers')
@UseGuards(AuthGuard, PermissionGuard)
export class StockTransferController {
  constructor(private readonly transferService: StockTransferService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async list(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('sourceStoreId') sourceStoreId?: string,
    @Query('destinationStoreId') destinationStoreId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: StockTransferResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { transfers, total } = await this.transferService.findAll({
      organizationId,
      communityId,
      sourceStoreId,
      destinationStoreId,
      status,
      skip,
      take: limitNum,
    });

    return {
      data: transfers.map(toStockTransferDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_TRANSFER)
  async create(@Body() body: any, @CurrentActor() actor: Actor): Promise<StockTransferResponseDto> {
    const transfer = await this.transferService.createTransfer(body, actor);
    return toStockTransferDto(transfer);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getById(@Param('id') id: string): Promise<StockTransferResponseDto> {
    const transfer = await this.transferService.findById(id);
    return toStockTransferDto(transfer);
  }

  @Post(':id/receive')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_TRANSFER)
  async receive(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<StockTransferResponseDto> {
    const transfer = await this.transferService.receiveTransfer(id, actor);
    return toStockTransferDto(transfer);
  }
}
