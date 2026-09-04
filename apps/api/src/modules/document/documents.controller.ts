import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { DocumentService } from './document.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  createDocumentSchema,
  updateDocumentSchema,
  createDocumentVersionSchema,
  createDocumentLinkSchema,
  documentQuerySchema,
} from '@community-os/validation';
import {
  toDocumentSummaryDto,
  toDocumentVersionResponseDto,
  toDocumentLinkResponseDto,
  type DocumentSummaryDto,
  type DocumentVersionResponseDto,
  type DocumentLinkResponseDto,
} from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Document Core')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly authService: AuthorizationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new document record with initial file version' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document created' })
  async createDocument(
    @Body() body: unknown,
    @Query('organizationId') organizationId: string | undefined,
    @Query('communityId') communityId: string | undefined,
    @CurrentActor() actor: Actor,
  ): Promise<DocumentSummaryDto> {
    if (!organizationId) {
      throw new DomainException(
        'ORGANIZATION_ID_REQUIRED',
        'organizationId query param is required to create documents',
        HttpStatus.BAD_REQUEST,
      );
    }

    const validated = createDocumentSchema.parse(body);

    await this.authService.enforce(actor, PERMISSIONS.DOCUMENT_CREATE, {
      scopeType: communityId ? 'COMMUNITY' : 'ORGANIZATION',
      scopeId: communityId || organizationId,
    });

    const { document, version } = await this.documentService.createDocument(
      organizationId,
      communityId,
      validated,
      actor,
    );

    return toDocumentSummaryDto(document, version);
  }

  @Get()
  @ApiOperation({ summary: 'List documents with tenant and classification filtering' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document list' })
  async listDocuments(
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: DocumentSummaryDto[]; total: number; page: number; limit: number }> {
    const validated = documentQuerySchema.parse(query);

    await this.authService.enforce(actor, PERMISSIONS.DOCUMENT_VIEW, {
      scopeType: validated.communityId
        ? 'COMMUNITY'
        : validated.organizationId
          ? 'ORGANIZATION'
          : 'PLATFORM',
      scopeId: validated.communityId || validated.organizationId || null,
    });

    const result = await this.documentService.listDocuments(validated, actor);
    return {
      items: result.items.map((doc) => toDocumentSummaryDto(doc)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details and version history' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document details' })
  async getDocument(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<
    DocumentSummaryDto & {
      versions: DocumentVersionResponseDto[];
      links: DocumentLinkResponseDto[];
    }
  > {
    const { document, currentVersion, versions, links } =
      await this.documentService.getDocumentById(id, actor);

    return {
      ...toDocumentSummaryDto(document, currentVersion),
      versions: versions.map((v) => toDocumentVersionResponseDto(v)),
      links: links.map((l) => toDocumentLinkResponseDto(l)),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document updated' })
  async updateDocument(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<DocumentSummaryDto> {
    const validated = updateDocumentSchema.parse(body);
    const updated = await this.documentService.updateDocument(id, validated, actor);
    return toDocumentSummaryDto(updated);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document archived' })
  async archiveDocument(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<DocumentSummaryDto> {
    const archived = await this.documentService.archiveDocument(id, actor);
    return toDocumentSummaryDto(archived);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Upload incremental document version' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Version added' })
  async addVersion(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<DocumentVersionResponseDto> {
    const validated = createDocumentVersionSchema.parse(body);
    const version = await this.documentService.uploadVersion(id, validated, actor);
    return toDocumentVersionResponseDto(version);
  }

  @Post(':id/links')
  @ApiOperation({ summary: 'Link document to a resource (Unit, Building, Resident)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Resource linked' })
  async linkResource(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<DocumentLinkResponseDto> {
    const validated = createDocumentLinkSchema.parse(body);
    const link = await this.documentService.linkResource(id, validated, actor);
    return toDocumentLinkResponseDto(link);
  }

  @Delete(':id/links/:linkId')
  @ApiOperation({ summary: 'Unlink document from resource' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Resource unlinked' })
  async unlinkResource(
    @Param('linkId') linkId: string,
    @CurrentActor() actor: Actor,
  ): Promise<{ success: boolean }> {
    const success = await this.documentService.unlinkResource(linkId, actor);
    return { success };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download or stream authorized document file' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File binary stream' })
  async downloadDocument(
    @Param('id') id: string,
    @Query('version') version: string | undefined,
    @CurrentActor() actor: Actor,
    @Res() res: Response,
  ): Promise<void> {
    const versionNum = version ? parseInt(version, 10) : undefined;
    const file = await this.documentService.downloadDocument(id, versionNum, actor);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    );
    res.setHeader('Content-Length', file.sizeBytes);

    file.stream.pipe(res);
  }
}
