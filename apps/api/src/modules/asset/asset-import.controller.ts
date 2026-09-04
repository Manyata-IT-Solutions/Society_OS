import { Controller, Post, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toAssetImportJobDto, type AssetImportJobResponseDto } from '@community-os/contracts';
import { AssetImportService } from './asset-import.service.js';

@Controller('assets/import')
@UseGuards(AuthGuard, PermissionGuard)
export class AssetImportController {
  constructor(private readonly importService: AssetImportService) {}

  @Post('preview')
  @RequirePermission(PERMISSIONS.ASSET_BULK_IMPORT)
  @HttpCode(HttpStatus.OK)
  async previewCsv(
    @Body() body: { csvContent: string },
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId: string,
  ): Promise<{ total: number; validCount: number; errors: Array<{ row: number; error: string }> }> {
    const result = await this.importService.parseAndValidateCsv(
      body.csvContent,
      organizationId,
      communityId,
    );
    return {
      total: result.rows.length + result.errors.length,
      validCount: result.rows.length,
      errors: result.errors,
    };
  }

  @Post('execute')
  @RequirePermission(PERMISSIONS.ASSET_BULK_IMPORT)
  @HttpCode(HttpStatus.CREATED)
  async executeImport(
    @Body() body: { fileName: string; csvContent: string },
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId: string,
    @CurrentActor() actor: Actor,
  ): Promise<AssetImportJobResponseDto> {
    const job = await this.importService.executeImport(
      body.fileName,
      body.csvContent,
      organizationId,
      communityId,
      actor,
    );
    return toAssetImportJobDto(job);
  }
}
