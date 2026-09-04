import {
  Controller,
  Get,
  Post,
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
import type { Actor, Asset } from '@community-os/types';
import {
  toAssetDetailDto,
  type AssetDetailResponseDto,
  type AssetQrScanResultResponseDto,
} from '@community-os/contracts';
import { AssetService } from './asset.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Controller('assets')
@UseGuards(AuthGuard, PermissionGuard)
export class AssetIdentifierController {
  constructor(
    private readonly assetService: AssetService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('scan/:identifier')
  @RequirePermission(PERMISSIONS.ASSET_SCAN)
  async scanIdentifier(
    @Param('identifier') identifier: string,
    @CurrentActor() actor: Actor,
  ): Promise<AssetQrScanResultResponseDto> {
    const asset = await this.assetService.getAssetByIdentifier(identifier);

    // Fetch open work orders for this asset
    const links = await this.prisma.workOrderAssetLink.findMany({
      where: {
        assetId: asset.id,
        workOrder: {
          currentState: {
            notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'],
          },
        },
      },
      include: {
        workOrder: {
          include: { primaryAssignee: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const openWorkOrders = links.map((l) => ({
      id: l.workOrder.id,
      workOrderNumber: l.workOrder.workOrderNumber,
      title: l.workOrder.title,
      priority: l.workOrder.priority,
      currentState: l.workOrder.currentState,
      primaryAssigneeId: l.workOrder.primaryAssigneeId,
      primaryAssigneeName: l.workOrder.primaryAssignee?.displayName,
    }));

    const assignedWorkForCurrentUser = openWorkOrders.filter(
      (wo) => wo.primaryAssigneeId === actor.id,
    );

    const allowedActions = [
      'VIEW_DETAILS',
      'VIEW_HISTORY',
      'REPORT_BREAKDOWN',
      'LOG_METER_READING',
      'CREATE_WORK_ORDER',
      'UPDATE_CONDITION',
    ];

    return {
      asset: toAssetDetailDto(asset, {
        categoryName: (asset as Asset & { category?: { name: string } }).category?.name,
        modelName: (asset as Asset & { model?: { modelName: string } }).model?.modelName,
        buildingName: (asset as Asset & { building?: { name: string } }).building?.name,
        unitNumber: (asset as Asset & { unit?: { unitNumber: string } }).unit?.unitNumber,
        openWorkOrdersCount: openWorkOrders.length,
      }),
      openWorkOrders,
      assignedWorkForCurrentUser,
      allowedActions,
    };
  }

  @Get('lookup/:code')
  @RequirePermission(PERMISSIONS.ASSET_VIEW)
  async lookupByCode(
    @Param('code') code: string,
    @Query('organizationId') _organizationId: string,
    @Query('communityId') _communityId: string,
  ): Promise<AssetDetailResponseDto> {
    const asset = await this.assetService.getAssetByIdentifier(code);
    return toAssetDetailDto(asset);
  }

  @Get(':id/qr-label')
  @RequirePermission(PERMISSIONS.ASSET_QR_GENERATE)
  async getQrLabel(@Param('id') id: string): Promise<{
    assetCode: string;
    name: string;
    qrIdentifier: string;
    qrDataUrl: string;
    locationText: string;
  }> {
    const asset = await this.assetService.getAssetById(id);
    const locationText = asset.locationDescription || asset.locationType;
    const qrDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f8fafc"/><text x="100" y="90" font-family="monospace" font-size="12" text-anchor="middle" fill="%230f172a">${asset.assetCode}</text><text x="100" y="115" font-family="monospace" font-size="10" text-anchor="middle" fill="%2364748b">QR: ${asset.qrIdentifier.substring(0, 14)}...</text></svg>`;

    return {
      assetCode: asset.assetCode,
      name: asset.name,
      qrIdentifier: asset.qrIdentifier,
      qrDataUrl,
      locationText,
    };
  }

  @Post('qr-labels/bulk')
  @RequirePermission(PERMISSIONS.ASSET_QR_GENERATE)
  @HttpCode(HttpStatus.OK)
  async getBulkQrLabels(
    @Body() body: { assetIds: string[] },
  ): Promise<Array<{ assetCode: string; name: string; qrIdentifier: string; qrDataUrl: string }>> {
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: body.assetIds } },
    });

    return assets.map((a) => ({
      assetCode: a.assetCode,
      name: a.name,
      qrIdentifier: a.qrIdentifier,
      qrDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f8fafc"/><text x="100" y="90" font-family="monospace" font-size="12" text-anchor="middle" fill="%230f172a">${a.assetCode}</text><text x="100" y="115" font-family="monospace" font-size="10" text-anchor="middle" fill="%2364748b">QR: ${a.qrIdentifier.substring(0, 14)}...</text></svg>`,
    }));
  }
}
