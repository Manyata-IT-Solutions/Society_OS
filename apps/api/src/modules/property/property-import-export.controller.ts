import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PropertyImportExportService } from './property-import-export.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import {
  propertyImportCommitSchema,
  propertyImportRowSchema,
  z,
  type PropertyImportRowInput,
} from '@community-os/validation';
import type {
  PropertyImportValidationResultDto,
  PropertyImportJobResponseDto,
} from '@community-os/contracts';
import type { Actor } from '@community-os/types';

@ApiTags('Property - Import/Export')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('communities/:communityId')
export class PropertyImportExportController {
  constructor(private readonly importExportService: PropertyImportExportService) {}

  @Post('property-import/validate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.UNIT_IMPORT, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Validate CSV rows and return row-level error breakdown' })
  async validate(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
  ): Promise<PropertyImportValidationResultDto> {
    const validated = z.object({ rows: z.array(propertyImportRowSchema) }).parse(body);
    return this.importExportService.validateImportRows(
      communityId,
      validated.rows as PropertyImportRowInput[],
    );
  }

  @Post('property-import/commit')
  @RequirePermission(PERMISSIONS.UNIT_IMPORT, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Commit pre-validated CSV property hierarchy and units' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Import job completed' })
  async commit(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
    @CurrentActor() actor?: Actor,
  ): Promise<PropertyImportJobResponseDto> {
    const validated = propertyImportCommitSchema.parse(body);
    return this.importExportService.commitImport(communityId, validated, actor?.id);
  }

  @Get('units/export')
  @RequirePermission(PERMISSIONS.UNIT_EXPORT, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Export community units to sanitized CSV' })
  async export(@Param('communityId') communityId: string, @Res() res: Response): Promise<void> {
    const csvContent = await this.importExportService.exportUnitsCsv(communityId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="community-${communityId}-units.csv"`,
    );
    res.status(HttpStatus.OK).send(csvContent);
  }
}
