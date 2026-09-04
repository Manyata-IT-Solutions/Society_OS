import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, AssetCategory } from '@community-os/types';
import { createAssetCategorySchema, updateAssetCategorySchema } from '@community-os/validation';
import { toAssetCategoryDto, type AssetCategoryResponseDto } from '@community-os/contracts';
import { AssetCategoryService } from './asset-category.service.js';

@Controller('asset-categories')
@UseGuards(AuthGuard, PermissionGuard)
export class AssetCategoryController {
  constructor(private readonly service: AssetCategoryService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ASSET_CATEGORY_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetCategoryResponseDto> {
    const parsed = createAssetCategorySchema.parse(body);
    const category = await this.service.createCategory(parsed, actor);
    return toAssetCategoryDto(category);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ASSET_CATEGORY_VIEW)
  async listCategories(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: 'ACTIVE' | 'ARCHIVED',
    @Query('parentId') parentId?: string,
    @Query('search') search?: string,
  ): Promise<AssetCategoryResponseDto[]> {
    const categories = await this.service.listCategories({
      organizationId,
      communityId,
      status,
      parentId,
      search,
    });
    return categories.map((c) =>
      toAssetCategoryDto(c, {
        parentName: (c as AssetCategory & { parentCategory?: { name: string } | null })
          .parentCategory?.name,
      }),
    );
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ASSET_CATEGORY_VIEW)
  async getCategoryById(@Param('id') id: string): Promise<AssetCategoryResponseDto> {
    const category = await this.service.getCategoryById(id);
    return toAssetCategoryDto(category, {
      parentName: (category as AssetCategory & { parentCategory?: { name: string } | null })
        .parentCategory?.name,
    });
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.ASSET_CATEGORY_MANAGE)
  async updateCategory(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetCategoryResponseDto> {
    const parsed = updateAssetCategorySchema.parse(body);
    const category = await this.service.updateCategory(id, parsed, actor);
    return toAssetCategoryDto(category, {
      parentName: (category as AssetCategory & { parentCategory?: { name: string } | null })
        .parentCategory?.name,
    });
  }
}
