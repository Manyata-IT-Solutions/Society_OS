import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toInventoryIssueDto, type InventoryIssueResponseDto } from '@community-os/contracts';
import { InventoryIssueService } from './inventory-issue.service.js';

@Controller('inventory-issues')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryIssueController {
  constructor(private readonly issueService: InventoryIssueService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async list(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('storeId') storeId?: string,
    @Query('workOrderId') workOrderId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ): Promise<{
    data: InventoryIssueResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const { issues, total } = await this.issueService.findAll({
      organizationId,
      communityId,
      storeId,
      workOrderId,
      status,
      skip,
      take: limitNum,
    });

    return {
      data: issues.map(toInventoryIssueDto),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_ISSUE)
  async create(
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryIssueResponseDto> {
    const issue = await this.issueService.createIssue(body, actor);
    return toInventoryIssueDto(issue);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_VIEW)
  async getById(@Param('id') id: string): Promise<InventoryIssueResponseDto> {
    const issue = await this.issueService.findById(id);
    return toInventoryIssueDto(issue);
  }
}
