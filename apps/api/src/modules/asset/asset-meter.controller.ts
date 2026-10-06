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
import type { Actor, AssetMeterReading } from '@community-os/types';
import { createAssetMeterSchema, addAssetMeterReadingSchema } from '@community-os/validation';
import {
  toAssetMeterDto,
  toAssetMeterReadingDto,
  type AssetMeterResponseDto,
  type AssetMeterReadingResponseDto,
} from '@community-os/contracts';
import { AssetMeterService } from './asset-meter.service.js';

@Controller('asset-meters')
@UseGuards(AuthGuard, PermissionGuard)
export class AssetMeterController {
  constructor(private readonly service: AssetMeterService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ASSET_METER_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createMeter(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetMeterResponseDto> {
    const parsed = createAssetMeterSchema.parse(body);
    const meter = await this.service.createMeter(parsed, actor);
    return toAssetMeterDto(meter);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.ASSET_METER_VIEW)
  async getMeterById(@Param('id') id: string): Promise<AssetMeterResponseDto> {
    const meter = await this.service.getMeterById(id);
    return toAssetMeterDto(meter);
  }

  @Get('by-asset/:assetId')
  @RequirePermission(PERMISSIONS.ASSET_METER_VIEW)
  async listMetersForAsset(@Param('assetId') assetId: string): Promise<AssetMeterResponseDto[]> {
    const meters = await this.service.listMetersForAsset(assetId);
    return meters.map(toAssetMeterDto);
  }

  @Post(':id/readings')
  @RequirePermission(PERMISSIONS.ASSET_METER_READING_ADD)
  @HttpCode(HttpStatus.CREATED)
  async addReading(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<AssetMeterReadingResponseDto> {
    const parsed = addAssetMeterReadingSchema.parse(body);
    const reading = await this.service.recordReading(id, parsed, actor);
    return toAssetMeterReadingDto(reading, { recordedByName: actor.displayName });
  }

  @Get(':id/readings')
  @RequirePermission(PERMISSIONS.ASSET_METER_VIEW)
  async getReadingHistory(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<AssetMeterReadingResponseDto[]> {
    const readings = await this.service.getReadingHistory(id, limit ? Number(limit) : 50);
    return readings.map((r) =>
      toAssetMeterReadingDto(r, {
        recordedByName: (r as AssetMeterReading & { recordedByUser?: { displayName: string } })
          .recordedByUser?.displayName,
      }),
    );
  }
}
