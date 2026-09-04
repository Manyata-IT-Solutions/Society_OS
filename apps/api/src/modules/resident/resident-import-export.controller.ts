import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ResidentImportExportService } from './resident-import-export.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { validateResidentImportSchema, commitResidentImportSchema } from '@community-os/validation';
import type {
  ResidentImportValidationResultDto,
  ResidentImportJobResponseDto,
} from '@community-os/contracts';

@ApiTags('Residents - Import & Export')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('communities/:communityId')
export class ResidentImportExportController {
  constructor(private readonly importExportService: ResidentImportExportService) {}

  @Post('resident-import/validate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.RESIDENT_IMPORT, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Validate raw resident CSV rows before commit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Validation results and preview' })
  async validateImport(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
  ): Promise<ResidentImportValidationResultDto> {
    const validated = validateResidentImportSchema.parse(body);
    return this.importExportService.validateImportRows(communityId, validated.rows);
  }

  @Post('resident-import/commit')
  @RequirePermission(PERMISSIONS.RESIDENT_IMPORT, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({
    summary: 'Commit validated CSV rows and create residents, households, ownerships, tenancies',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Import job completed' })
  async commitImport(
    @Param('communityId') communityId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<ResidentImportJobResponseDto> {
    const validated = commitResidentImportSchema.parse(body);
    return this.importExportService.commitImport(communityId, validated, actor.id);
  }

  @Get('residents/export')
  @RequirePermission(PERMISSIONS.RESIDENT_VIEW, {
    scopeType: 'COMMUNITY',
    scopeParam: 'communityId',
  })
  @ApiOperation({ summary: 'Export community residents to CSV' })
  @ApiResponse({ status: HttpStatus.OK, description: 'CSV file download' })
  async exportCsv(@Param('communityId') communityId: string, @Res() res: Response): Promise<void> {
    const csvContent = await this.importExportService.exportResidentsCsv(communityId);
    const filename = `residents-${communityId}-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(csvContent);
  }
}
