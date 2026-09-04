import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomFieldService } from './custom-field.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, CustomFieldEntityType } from '@community-os/types';
import {
  createCustomFieldDefinitionSchema,
  updateCustomFieldDefinitionSchema,
  getCustomFieldsQuerySchema,
  setCustomFieldValuesBulkSchema,
} from '@community-os/validation';
import {
  toCustomFieldDefinitionResponseDto,
  toCustomFieldValueResponseDto,
} from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Custom Fields')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(
    private readonly customFieldService: CustomFieldService,
    private readonly authService: AuthorizationService,
  ) {}

  @Get('definitions')
  @ApiOperation({ summary: 'List custom field definitions' })
  async getDefinitions(@Query() query: unknown, @CurrentActor() actor: Actor) {
    const parsed = getCustomFieldsQuerySchema.parse(query);

    const orgId = parsed.organizationId;
    if (!orgId) {
      throw new DomainException(
        'VALIDATION_ERROR',
        'organizationId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.enforce(actor, PERMISSIONS.CUSTOM_FIELD_VIEW, {
      scopeType: 'ORGANIZATION',
      scopeId: orgId,
    });

    const definitions = await this.customFieldService.getDefinitions({
      ...parsed,
      organizationId: orgId,
    });

    return {
      items: definitions.map(toCustomFieldDefinitionResponseDto),
      total: definitions.length,
    };
  }

  @Post('definitions')
  @ApiOperation({ summary: 'Create a new custom field definition' })
  async createDefinition(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const parsed = createCustomFieldDefinitionSchema.parse(body);

    const orgId = parsed.organizationId;
    if (!orgId) {
      throw new DomainException(
        'VALIDATION_ERROR',
        'organizationId is required to create a custom field definition',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.enforce(actor, PERMISSIONS.CUSTOM_FIELD_MANAGE, {
      scopeType: 'ORGANIZATION',
      scopeId: orgId,
    });

    const created = await this.customFieldService.createDefinition(parsed, {
      userId: actor.id,
      organizationId: orgId,
      communityId: parsed.communityId || null,
    });

    return toCustomFieldDefinitionResponseDto(created);
  }

  @Patch('definitions/:id')
  @ApiOperation({ summary: 'Update an existing custom field definition' })
  async updateDefinition(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ) {
    const parsed = updateCustomFieldDefinitionSchema.parse(body);

    const existing = await this.customFieldService.getDefinition(id);
    await this.authService.enforce(actor, PERMISSIONS.CUSTOM_FIELD_MANAGE, {
      scopeType: 'ORGANIZATION',
      scopeId: existing.organizationId,
    });

    const updated = await this.customFieldService.updateDefinition(id, parsed, {
      userId: actor.id,
      organizationId: existing.organizationId,
      communityId: existing.communityId,
    });

    return toCustomFieldDefinitionResponseDto(updated);
  }

  @Post('definitions/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a custom field definition' })
  async archiveDefinition(@Param('id') id: string, @CurrentActor() actor: Actor) {
    const existing = await this.customFieldService.getDefinition(id);
    await this.authService.enforce(actor, PERMISSIONS.CUSTOM_FIELD_MANAGE, {
      scopeType: 'ORGANIZATION',
      scopeId: existing.organizationId,
    });

    const archived = await this.customFieldService.archiveDefinition(id, {
      userId: actor.id,
      organizationId: existing.organizationId,
      communityId: existing.communityId,
    });

    return toCustomFieldDefinitionResponseDto(archived);
  }

  @Get('values/:entityType/:entityId')
  @ApiOperation({ summary: 'Get custom field definitions and values for an entity' })
  async getEntityValues(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Param('entityId') entityId: string,
    @Query('organizationId') queryOrgId: string | undefined,
    @CurrentActor() actor: Actor,
  ) {
    const orgId = queryOrgId;

    await this.authService.enforce(actor, PERMISSIONS.CUSTOM_FIELD_VIEW, {
      scopeType: orgId ? 'ORGANIZATION' : 'PLATFORM',
      scopeId: orgId || null,
    });

    const { definitions, values } = await this.customFieldService.getEntityValues(
      entityType,
      entityId,
      {
        organizationId: orgId || '',
        communityId: null,
      },
    );

    return {
      definitions: definitions.map(toCustomFieldDefinitionResponseDto),
      values: values.map((v) => toCustomFieldValueResponseDto(v)),
    };
  }

  @Put('values/:entityType/:entityId')
  @ApiOperation({ summary: 'Set or update custom field values on an entity' })
  async setEntityValues(
    @Param('entityType') entityType: CustomFieldEntityType,
    @Param('entityId') entityId: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ) {
    const parsed = setCustomFieldValuesBulkSchema.parse(body);

    await this.authService.enforce(actor, PERMISSIONS.CUSTOM_FIELD_VALUE_UPDATE, {
      scopeType: 'PLATFORM',
      scopeId: null,
    });

    const results = await this.customFieldService.setEntityValues(entityType, entityId, parsed, {
      userId: actor.id,
      organizationId: null,
      communityId: null,
    });

    return {
      items: results.map((r) => toCustomFieldValueResponseDto(r)),
      total: results.length,
    };
  }
}
