import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, ConfigurationScopeType } from '@community-os/types';
import {
  setConfigurationOverrideSchema,
  getConfigurationOverridesQuerySchema,
  getEffectiveConfigurationQuerySchema,
} from '@community-os/validation';
import {
  toConfigurationKeyDefinitionDto,
  toConfigurationOverrideResponseDto,
  toEffectiveConfigurationResponseDto,
} from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Configuration Engine')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly configService: ConfigurationService,
    private readonly authService: AuthorizationService,
  ) {}

  @Get('registry')
  @ApiOperation({ summary: 'Get all registered canonical configuration keys' })
  async getRegistry(@CurrentActor() actor: Actor) {
    await this.authService.enforce(actor, PERMISSIONS.CONFIG_VIEW, {
      scopeType: 'PLATFORM',
      scopeId: null,
    });

    const keys = this.configService.getRegistry();
    return {
      items: keys.map(toConfigurationKeyDefinitionDto),
      total: keys.length,
    };
  }

  @Get('effective')
  @ApiOperation({ summary: 'Resolve effective configuration values with inheritance' })
  async getEffective(@Query() query: unknown, @CurrentActor() actor: Actor) {
    const parsed = getEffectiveConfigurationQuerySchema.parse(query);

    const orgId = parsed.organizationId;
    const commId = parsed.communityId;

    await this.authService.enforce(actor, PERMISSIONS.CONFIG_VIEW, {
      scopeType: commId ? 'COMMUNITY' : orgId ? 'ORGANIZATION' : 'PLATFORM',
      scopeId: commId || orgId || null,
    });

    const keys = parsed.keys ? parsed.keys.split(',').map((k) => k.trim()) : undefined;

    const effective = await this.configService.getEffectiveConfig(
      { organizationId: orgId || undefined, communityId: commId || undefined },
      keys,
      parsed.namespace,
    );

    return {
      items: effective.map(toEffectiveConfigurationResponseDto),
      total: effective.length,
    };
  }

  @Get('overrides')
  @ApiOperation({ summary: 'List active configuration overrides' })
  async getOverrides(@Query() query: unknown, @CurrentActor() actor: Actor) {
    const parsed = getConfigurationOverridesQuerySchema.parse(query);

    const orgId = parsed.organizationId;
    const commId = parsed.communityId;

    await this.authService.enforce(actor, PERMISSIONS.CONFIG_VIEW, {
      scopeType: commId ? 'COMMUNITY' : orgId ? 'ORGANIZATION' : 'PLATFORM',
      scopeId: commId || orgId || null,
    });

    const overrides = await this.configService.getOverrides({
      ...parsed,
      organizationId: orgId || undefined,
      communityId: commId || undefined,
    });

    return {
      items: overrides.map(toConfigurationOverrideResponseDto),
      total: overrides.length,
    };
  }

  @Put('overrides')
  @ApiOperation({ summary: 'Set or update a scoped configuration override' })
  async setOverride(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const parsed = setConfigurationOverrideSchema.parse(body);

    await this.authService.enforce(actor, PERMISSIONS.CONFIG_MANAGE, {
      scopeType: parsed.scopeType,
      scopeId: parsed.scopeId || null,
    });

    const override = await this.configService.setOverride(parsed, {
      userId: actor.id,
      organizationId: parsed.scopeType === 'ORGANIZATION' ? parsed.scopeId : null,
      communityId: parsed.scopeType === 'COMMUNITY' ? parsed.scopeId : null,
    });

    return toConfigurationOverrideResponseDto(override);
  }

  @Delete('overrides')
  @ApiOperation({ summary: 'Reset/delete a configuration override' })
  async deleteOverride(
    @Query('key') key: string,
    @Query('scopeType') scopeType: ConfigurationScopeType,
    @Query('scopeId') scopeId: string | undefined,
    @CurrentActor() actor: Actor,
  ) {
    if (!key || !scopeType) {
      throw new DomainException(
        'VALIDATION_ERROR',
        'key and scopeType query parameters are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.enforce(actor, PERMISSIONS.CONFIG_MANAGE, {
      scopeType,
      scopeId: scopeId || null,
    });

    const deleted = await this.configService.deleteOverride(key, scopeType, scopeId || null, {
      userId: actor.id,
      organizationId: scopeType === 'ORGANIZATION' ? scopeId : null,
      communityId: scopeType === 'COMMUNITY' ? scopeId : null,
    });

    return toConfigurationOverrideResponseDto(deleted);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview validation of a configuration key and value' })
  async validate(
    @Body() body: { key: string; value: unknown; scopeType: ConfigurationScopeType },
    @CurrentActor() actor: Actor,
  ) {
    await this.authService.enforce(actor, PERMISSIONS.CONFIG_VIEW, {
      scopeType: body.scopeType || 'PLATFORM',
      scopeId: null,
    });

    if (!body.key || !body.scopeType) {
      throw new DomainException(
        'VALIDATION_ERROR',
        'key and scopeType are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.configService.previewValidation(body.key, body.value, body.scopeType);
  }
}
