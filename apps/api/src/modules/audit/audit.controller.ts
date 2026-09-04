import { Controller, Get, Param, Query, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuditService } from './audit.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { auditQuerySchema, exportAuditSchema } from '@community-os/validation';
import {
  toAuditRecordSummaryDto,
  toAuditRecordDetailDto,
  type AuditRecordSummaryDto,
  type AuditRecordDetailDto,
} from '@community-os/contracts';

@ApiTags('Audit Engine')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly authService: AuthorizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List and search enterprise audit records' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit records retrieved' })
  async listAuditRecords(
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: AuditRecordSummaryDto[]; total: number; page: number; limit: number }> {
    const validated = auditQuerySchema.parse(query);

    await this.authService.enforce(actor, PERMISSIONS.AUDIT_VIEW, {
      scopeType: validated.communityId
        ? 'COMMUNITY'
        : validated.organizationId
          ? 'ORGANIZATION'
          : 'PLATFORM',
      scopeId: validated.communityId || validated.organizationId || null,
    });

    const result = await this.auditService.listAuditRecords(validated, actor);
    return {
      items: result.items.map((item) => toAuditRecordSummaryDto(item)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export authorized audit records to CSV' })
  @ApiResponse({ status: HttpStatus.OK, description: 'CSV file stream' })
  async exportAuditCsv(
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
    @Res() res: Response,
  ): Promise<void> {
    const validated = exportAuditSchema.parse(query);

    await this.authService.enforce(actor, PERMISSIONS.AUDIT_EXPORT, {
      scopeType: validated.communityId
        ? 'COMMUNITY'
        : validated.organizationId
          ? 'ORGANIZATION'
          : 'PLATFORM',
      scopeId: validated.communityId || validated.organizationId || null,
    });

    const csvContent = await this.auditService.exportAuditCsv(validated, actor);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-export-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.status(HttpStatus.OK).send(csvContent);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed audit record with change snapshots' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit record details' })
  async getAuditRecord(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<AuditRecordDetailDto> {
    const record = await this.auditService.getAuditRecordById(id, actor);

    await this.authService.enforce(actor, PERMISSIONS.AUDIT_VIEW, {
      scopeType: record.communityId
        ? 'COMMUNITY'
        : record.organizationId
          ? 'ORGANIZATION'
          : 'PLATFORM',
      scopeId: record.communityId || record.organizationId || null,
    });

    const hasSensitiveAccess = await this.authService.can(actor, PERMISSIONS.AUDIT_VIEW_SENSITIVE, {
      scopeType: record.communityId
        ? 'COMMUNITY'
        : record.organizationId
          ? 'ORGANIZATION'
          : 'PLATFORM',
      scopeId: record.communityId || record.organizationId || null,
    });

    return toAuditRecordDetailDto(record, hasSensitiveAccess);
  }
}
