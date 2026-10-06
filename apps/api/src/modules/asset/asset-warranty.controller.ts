import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { createAssetWarrantySchema } from '@community-os/validation';
import { toAssetWarrantyDto, type AssetWarrantyResponseDto } from '@community-os/contracts';
import { AssetWarrantyService } from './asset-warranty.service.js';

@Controller('asset-warranties')
@UseGuards(AuthGuard, PermissionGuard)
export class AssetWarrantyController {
  constructor(private readonly service: AssetWarrantyService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ASSET_WARRANTY_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createWarranty(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetWarrantyResponseDto> {
    const parsed = createAssetWarrantySchema.parse(body);
    const warranty = await this.service.createWarranty(parsed, actor);
    return toAssetWarrantyDto(warranty);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ASSET_WARRANTY_VIEW)
  async getWarrantyById(@Param('id') id: string): Promise<AssetWarrantyResponseDto> {
    const warranty = await this.service.getWarrantyById(id);
    return toAssetWarrantyDto(warranty);
  }

  @Get('by-asset/:assetId')
  @RequirePermission(PERMISSIONS.ASSET_WARRANTY_VIEW)
  async listWarrantiesForAsset(
    @Param('assetId') assetId: string,
  ): Promise<AssetWarrantyResponseDto[]> {
    const warranties = await this.service.listWarrantiesForAsset(assetId);
    return warranties.map(toAssetWarrantyDto);
  }
}
