import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toInventoryReceiptDto, type InventoryReceiptResponseDto } from '@community-os/contracts';
import { InventoryReceiptService } from './inventory-receipt.service.js';

@Controller('inventory-receipts')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryReceiptController {
  constructor(private readonly receiptService: InventoryReceiptService) {}

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
    data: InventoryReceiptResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { receipts, total } = await this.receiptService.findAll({
      organizationId,
      communityId,
      storeId,
      status,
      skip,
      take: limitNum,
    });

    return {
      data: receipts.map(toInventoryReceiptDto),
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
  ): Promise<InventoryReceiptResponseDto> {
    const receipt = await this.receiptService.createReceipt(body, actor);
    return toInventoryReceiptDto(receipt);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getById(@Param('id') id: string): Promise<InventoryReceiptResponseDto> {
    const receipt = await this.receiptService.findById(id);
    return toInventoryReceiptDto(receipt);
  }

  @Post(':id/reverse')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_REVERSE)
  async reverse(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryReceiptResponseDto> {
    const receipt = await this.receiptService.reverseReceipt(id, reason, actor);
    return toInventoryReceiptDto(receipt);
  }
}
