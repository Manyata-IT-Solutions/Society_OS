import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import {
  toStockBalanceDto,
  toStockLedgerEntryDto,
  type StockBalanceResponseDto,
  type StockLedgerEntryResponseDto,
  type InventoryKpiMetricsResponseDto,
} from '@community-os/contracts';
import { StockBalanceService } from './stock-balance.service.js';
import { StockLedgerService } from './stock-ledger.service.js';

@Controller('inventory')
@UseGuards(AuthGuard, PermissionGuard)
export class StockBalanceController {
  constructor(
    private readonly balanceService: StockBalanceService,
    private readonly ledgerService: StockLedgerService,
  ) {}

  @Get(['balances', 'stock-balances'])
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getBalances(
    @Query('storeId') storeId?: string,
    @Query('itemId') itemId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: StockBalanceResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { balances, total } = await this.balanceService.getBalances({
      storeId,
      itemId,
      categoryId,
      lowStockOnly: lowStockOnly === 'true',
      skip,
      take: limitNum,
    });

    return {
      data: balances.map(toStockBalanceDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Get(['ledger', 'stock-ledger', 'balances/ledger'])
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getLedger(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('storeId') storeId?: string,
    @Query('itemId') itemId?: string,
    @Query('transactionType') transactionType?: any,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: StockLedgerEntryResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { entries, total } = await this.ledgerService.getLedger({
      organizationId,
      communityId,
      storeId,
      itemId,
      transactionType,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      skip,
      take: limitNum,
    });

    return {
      data: entries.map(toStockLedgerEntryDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Get('metrics')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getMetrics(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
  ): Promise<InventoryKpiMetricsResponseDto> {
    return this.balanceService.getMetrics(organizationId, communityId);
  }
}
