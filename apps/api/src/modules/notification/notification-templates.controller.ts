import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationTemplateRepository } from './notification-template.repository.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
} from '@community-os/validation';
import {
  toNotificationTemplateResponseDto,
  type NotificationTemplateResponseDto,
} from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Notifications - Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('notification-templates')
export class NotificationTemplatesController {
  constructor(
    private readonly templateRepo: NotificationTemplateRepository,
    private readonly authService: AuthorizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notification templates' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Templates list' })
  async listTemplates(
    @Query('communityId') communityId: string | undefined,
    @Query('organizationId') organizationId: string | undefined,
    @CurrentActor() actor: Actor,
  ): Promise<{ items: NotificationTemplateResponseDto[] }> {
    await this.authService.enforce(actor, PERMISSIONS.NOTIFICATION_MANAGE_TEMPLATES, {
      scopeType: communityId ? 'COMMUNITY' : organizationId ? 'ORGANIZATION' : 'PLATFORM',
      scopeId: communityId || organizationId || null,
    });

    const templates = await this.templateRepo.findMany({
      communityId,
      organizationId,
    });

    return {
      items: templates.map((t) => toNotificationTemplateResponseDto(t)),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new notification template' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Template created' })
  async createTemplate(
    @Body() body: unknown,
    @Query('communityId') communityId: string | undefined,
    @Query('organizationId') organizationId: string | undefined,
    @CurrentActor() actor: Actor,
  ): Promise<NotificationTemplateResponseDto> {
    const validated = createNotificationTemplateSchema.parse(body);

    await this.authService.enforce(actor, PERMISSIONS.NOTIFICATION_MANAGE_TEMPLATES, {
      scopeType: communityId ? 'COMMUNITY' : organizationId ? 'ORGANIZATION' : 'PLATFORM',
      scopeId: communityId || organizationId || null,
    });

    const template = await this.templateRepo.create(
      organizationId || null,
      communityId || null,
      validated,
    );

    return toNotificationTemplateResponseDto(template);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification template by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template details' })
  async getTemplate(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<NotificationTemplateResponseDto> {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw new DomainException(
        'TEMPLATE_NOT_FOUND',
        `Notification template ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.authService.enforce(actor, PERMISSIONS.NOTIFICATION_MANAGE_TEMPLATES, {
      scopeType: template.communityId
        ? 'COMMUNITY'
        : template.organizationId
          ? 'ORGANIZATION'
          : 'PLATFORM',
      scopeId: template.communityId || template.organizationId || null,
    });

    return toNotificationTemplateResponseDto(template);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification template' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template updated' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<NotificationTemplateResponseDto> {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw new DomainException(
        'TEMPLATE_NOT_FOUND',
        `Notification template ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.authService.enforce(actor, PERMISSIONS.NOTIFICATION_MANAGE_TEMPLATES, {
      scopeType: template.communityId
        ? 'COMMUNITY'
        : template.organizationId
          ? 'ORGANIZATION'
          : 'PLATFORM',
      scopeId: template.communityId || template.organizationId || null,
    });

    const validated = updateNotificationTemplateSchema.parse(body);
    const updated = await this.templateRepo.update(id, validated);
    return toNotificationTemplateResponseDto(updated);
  }
}
