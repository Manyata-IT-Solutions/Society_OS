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
import type { Actor, AssetModel } from '@community-os/types';
import { createAssetModelSchema, updateAssetModelSchema } from '@community-os/validation';
import { toAssetModelDto, type AssetModelResponseDto } from '@community-os/contracts';
import { AssetModelService } from './asset-model.service.js';

@Controller('asset-models')
@UseGuards(AuthGuard, PermissionGuard)
export class AssetModelController {
  constructor(private readonly service: AssetModelService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ASSET_MODEL_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createModel(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetModelResponseDto> {
    const parsed = createAssetModelSchema.parse(body);
    const model = await this.service.createModel(parsed, actor);
    return toAssetModelDto(model, {
      categoryName: (model as AssetModel & { category?: { name: string } }).category?.name,
    });
  }

  @Get()
  @RequirePermission(PERMISSIONS.ASSET_MODEL_VIEW)
  async listModels(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('manufacturer') manufacturer?: string,
    @Query('status') status?: 'ACTIVE' | 'ARCHIVED',
    @Query('search') search?: string,
  ): Promise<AssetModelResponseDto[]> {
    const models = await this.service.listModels({
      organizationId,
      communityId,
      categoryId,
      manufacturer,
      status,
      search,
    });
    return models.map((m) =>
      toAssetModelDto(m, {
        categoryName: (m as AssetModel & { category?: { name: string } }).category?.name,
      }),
    );
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ASSET_MODEL_VIEW)
  async getModelById(@Param('id') id: string): Promise<AssetModelResponseDto> {
    const model = await this.service.getModelById(id);
    return toAssetModelDto(model, {
      categoryName: (model as AssetModel & { category?: { name: string } }).category?.name,
    });
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.ASSET_MODEL_MANAGE)
  async updateModel(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetModelResponseDto> {
    const parsed = updateAssetModelSchema.parse(body);
    const model = await this.service.updateModel(id, parsed, actor);
    return toAssetModelDto(model, {
      categoryName: (model as AssetModel & { category?: { name: string } }).category?.name,
    });
  }
}
