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
import type { Actor, Asset, AssetKpiMetrics } from '@community-os/types';
import {
  createAssetSchema,
  updateAssetSchema,
  moveAssetLocationSchema,
  commissionAssetSchema,
  decommissionAssetSchema,
  disposeAssetSchema,
  updateAssetConditionSchema,
  reportAssetBreakdownSchema,
  assetQueryFilterSchema,
} from '@community-os/validation';
import {
  toAssetSummaryDto,
  toAssetDetailDto,
  toAssetLocationHistoryDto,
  type AssetSummaryResponseDto,
  type AssetDetailResponseDto,
  type AssetLocationHistoryResponseDto,
} from '@community-os/contracts';
import { AssetService } from './asset.service.js';

@Controller('assets')
@UseGuards(AuthGuard, PermissionGuard)
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ASSET_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createAsset(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const parsed = createAssetSchema.parse(body);
    const asset = await this.service.createAsset(parsed, actor);
    return toAssetDetailDto(asset);
  }

  @Get('analytics/kpi')
  @RequirePermission(PERMISSIONS.ASSET_ANALYTICS_VIEW)
  async getKpiAnalytics(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
  ): Promise<AssetKpiMetrics> {
    return this.service.getKpiMetrics(organizationId, communityId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ASSET_VIEW)
  async listAssets(@Query() query: unknown): Promise<{
    items: AssetSummaryResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const parsed = assetQueryFilterSchema.parse(query);
    const result = await this.service.listAssets(parsed);
    return {
      items: result.items.map((a) =>
        toAssetSummaryDto(a, {
          categoryName: (a as Asset & { category?: { name: string } }).category?.name,
          modelName: (a as Asset & { model?: { modelName: string } }).model?.modelName,
          buildingName: (a as Asset & { building?: { name: string } }).building?.name,
          unitNumber: (a as Asset & { unit?: { unitNumber: string } }).unit?.unitNumber,
        }),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ASSET_VIEW)
  async getAssetById(@Param('id') id: string): Promise<AssetDetailResponseDto> {
    const asset = await this.service.getAssetById(id);
    return toAssetDetailDto(asset, {
      categoryName: (asset as Asset & { category?: { name: string } }).category?.name,
      modelName: (asset as Asset & { model?: { modelName: string } }).model?.modelName,
      buildingName: (asset as Asset & { building?: { name: string } }).building?.name,
      unitNumber: (asset as Asset & { unit?: { unitNumber: string } }).unit?.unitNumber,
      parentAssetName: (asset as Asset & { parentAsset?: { name: string } }).parentAsset?.name,
    });
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.ASSET_UPDATE)
  async updateAsset(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const parsed = updateAssetSchema.parse(body);
    const asset = await this.service.updateAsset(id, parsed, actor);
    return toAssetDetailDto(asset);
  }

  @Post(':id/move')
  @RequirePermission(PERMISSIONS.ASSET_MOVE)
  @HttpCode(HttpStatus.OK)
  async moveAssetLocation(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const parsed = moveAssetLocationSchema.parse(body);
    const asset = await this.service.moveAssetLocation(id, parsed, actor);
    return toAssetDetailDto(asset);
  }

  @Get(':id/location-history')
  @RequirePermission(PERMISSIONS.ASSET_VIEW)
  async getLocationHistory(@Param('id') id: string): Promise<AssetLocationHistoryResponseDto[]> {
    const history = await this.service.getLocationHistory(id);
    return history.map((h) => toAssetLocationHistoryDto(h));
  }

  @Post(':id/commission')
  @RequirePermission(PERMISSIONS.ASSET_COMMISSION)
  @HttpCode(HttpStatus.OK)
  async commissionAsset(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const parsed = commissionAssetSchema.parse(body);
    const asset = await this.service.commissionAsset(id, parsed, actor);
    return toAssetDetailDto(asset);
  }

  @Post(':id/decommission')
  @RequirePermission(PERMISSIONS.ASSET_DECOMMISSION)
  @HttpCode(HttpStatus.OK)
  async decommissionAsset(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const parsed = decommissionAssetSchema.parse(body);
    const asset = await this.service.decommissionAsset(id, parsed, actor);
    return toAssetDetailDto(asset);
  }

  @Post(':id/dispose')
  @RequirePermission(PERMISSIONS.ASSET_DISPOSE)
  @HttpCode(HttpStatus.OK)
  async disposeAsset(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const parsed = disposeAssetSchema.parse(body);
    const asset = await this.service.disposeAsset(id, parsed, actor);
    return toAssetDetailDto(asset);
  }

  @Post(':id/condition')
  @RequirePermission(PERMISSIONS.ASSET_CONDITION_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateCondition(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const parsed = updateAssetConditionSchema.parse(body);
    const asset = await this.service.updateCondition(
      id,
      parsed.condition,
      parsed.operationalStatus,
      actor,
    );
    return toAssetDetailDto(asset);
  }

  @Post(':id/breakdown')
  @RequirePermission(PERMISSIONS.ASSET_BREAKDOWN_REPORT)
  @HttpCode(HttpStatus.OK)
  async reportBreakdown(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const parsed = reportAssetBreakdownSchema.parse(body);
    const asset = await this.service.reportBreakdown(id, parsed, actor);
    return toAssetDetailDto(asset);
  }

  @Post(':id/restore')
  @RequirePermission(PERMISSIONS.ASSET_UPDATE)
  @HttpCode(HttpStatus.OK)
  async restoreAsset(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const asset = await this.service.restoreAsset(id, body.notes ?? null, actor);
    return toAssetDetailDto(asset);
  }

  @Post(':id/qr/regenerate')
  @RequirePermission(PERMISSIONS.ASSET_QR_GENERATE)
  @HttpCode(HttpStatus.OK)
  async regenerateQr(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<AssetDetailResponseDto> {
    const asset = await this.service.regenerateQr(id, actor);
    return toAssetDetailDto(asset);
  }

  @Get(':id/service-history')
  @RequirePermission(PERMISSIONS.ASSET_HISTORY_VIEW)
  async getServiceHistory(@Param('id') id: string): Promise<unknown> {
    return this.service.getServiceHistory(id);
  }
}
