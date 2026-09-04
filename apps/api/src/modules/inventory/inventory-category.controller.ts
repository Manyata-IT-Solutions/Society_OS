import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toInventoryCategoryDto, type InventoryCategoryResponseDto } from '@community-os/contracts';
import { InventoryCategoryService } from './inventory-category.service.js';

@Controller('inventory-categories')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryCategoryController {
  constructor(private readonly categoryService: InventoryCategoryService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_CATEGORY_VIEW)
  async list(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
  ): Promise<InventoryCategoryResponseDto[]> {
    const categories = await this.categoryService.findAll(organizationId, communityId);
    return categories.map(toInventoryCategoryDto);
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_CATEGORY_MANAGE)
  async create(
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryCategoryResponseDto> {
    const category = await this.categoryService.create(body, actor);
    return toInventoryCategoryDto(category);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_CATEGORY_VIEW)
  async getById(@Param('id') id: string): Promise<InventoryCategoryResponseDto> {
    const category = await this.categoryService.findById(id);
    return toInventoryCategoryDto(category);
  }
}
