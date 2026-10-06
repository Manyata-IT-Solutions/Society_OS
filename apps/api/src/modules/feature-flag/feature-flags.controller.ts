import { Controller, Get, Put, Delete, Body, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagService } from './feature-flag.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor, FeatureScopeType } from '@community-os/types';
import { setFeatureOverrideSchema, getFeatureOverridesQuerySchema } from '@community-os/validation';
import {
  toFeatureDefinitionDto,
  toFeatureOverrideResponseDto,
  toEffectiveFeatureResponseDto,
} from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Feature Flags & Entitlements')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('features')
export class FeatureFlagsController {
  constructor(
    private readonly featureService: FeatureFlagService,
    private readonly authService: AuthorizationService,
  ) {}

  @Get('definitions')
  @ApiOperation({ summary: 'List all registered feature definitions' })
  async getDefinitions(@CurrentActor() actor: Actor) {
    await this.authService.enforce(actor, PERMISSIONS.FEATURE_VIEW, {
      scopeType: 'PLATFORM',
      scopeId: null,
    });

    const defs = this.featureService.getDefinitions();
    return {
      items: defs.map(toFeatureDefinitionDto),
      total: defs.length,
    };
  }

  @Get('effective')
  @ApiOperation({ summary: 'Resolve effective feature capabilities for a tenant' })
  async getEffective(
    @Query('organizationId') organizationId: string | undefined,
    @Query('communityId') communityId: string | undefined,
    @CurrentActor() actor: Actor,
  ) {
    const orgId = organizationId;
    const commId = communityId;

    await this.authService.enforce(actor, PERMISSIONS.FEATURE_VIEW, {
      scopeType: commId ? 'COMMUNITY' : orgId ? 'ORGANIZATION' : 'PLATFORM',
      scopeId: commId || orgId || null,
    });

    const features = await this.featureService.getEffectiveFeatures({
      organizationId: orgId || undefined,
      communityId: commId || undefined,
    });

    return {
      items: features.map(toEffectiveFeatureResponseDto),
      total: features.length,
    };
  }

  @Get('overrides')
  @ApiOperation({ summary: 'List feature flag overrides' })
  async getOverrides(@Query() query: unknown, @CurrentActor() actor: Actor) {
    const parsed = getFeatureOverridesQuerySchema.parse(query);

    const orgId = parsed.organizationId;
    const commId = parsed.communityId;

    await this.authService.enforce(actor, PERMISSIONS.FEATURE_VIEW, {
      scopeType: commId ? 'COMMUNITY' : orgId ? 'ORGANIZATION' : 'PLATFORM',
      scopeId: commId || orgId || null,
    });

    const overrides = await this.featureService.getOverrides({
      ...parsed,
      organizationId: orgId || undefined,
      communityId: commId || undefined,
    });

    return {
      items: overrides.map(toFeatureOverrideResponseDto),
      total: overrides.length,
    };
  }

  @Put('overrides')
  @ApiOperation({ summary: 'Set or update a feature flag override' })
  async setOverride(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const parsed = setFeatureOverrideSchema.parse(body);

    const permission =
      parsed.scopeType === 'PLATFORM'
        ? PERMISSIONS.FEATURE_MANAGE_PLATFORM
        : parsed.scopeType === 'ORGANIZATION'
          ? PERMISSIONS.FEATURE_MANAGE_ORGANIZATION
          : PERMISSIONS.FEATURE_MANAGE_COMMUNITY;

    await this.authService.enforce(actor, permission, {
      scopeType: parsed.scopeType,
      scopeId: parsed.scopeId || null,
    });

    const override = await this.featureService.setOverride(parsed, {
      userId: actor.id,
      organizationId: parsed.scopeType === 'ORGANIZATION' ? parsed.scopeId : null,
      communityId: parsed.scopeType === 'COMMUNITY' ? parsed.scopeId : null,
    });

    return toFeatureOverrideResponseDto(override);
  }

  @Delete('overrides')
  @ApiOperation({ summary: 'Reset a feature flag override' })
  async deleteOverride(
    @Query('featureKey') featureKey: string,
    @Query('scopeType') scopeType: FeatureScopeType,
    @Query('scopeId') scopeId: string | undefined,
    @CurrentActor() actor: Actor,
  ) {
    if (!featureKey || !scopeType) {
      throw new DomainException(
        'VALIDATION_ERROR',
        'featureKey and scopeType query parameters are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const permission =
      scopeType === 'PLATFORM'
        ? PERMISSIONS.FEATURE_MANAGE_PLATFORM
        : scopeType === 'ORGANIZATION'
          ? PERMISSIONS.FEATURE_MANAGE_ORGANIZATION
          : PERMISSIONS.FEATURE_MANAGE_COMMUNITY;

    await this.authService.enforce(actor, permission, {
      scopeType,
      scopeId: scopeId || null,
    });

    const deleted = await this.featureService.deleteOverride(
      featureKey,
      scopeType,
      scopeId || null,
      {
        userId: actor.id,
        organizationId: scopeType === 'ORGANIZATION' ? scopeId : null,
        communityId: scopeType === 'COMMUNITY' ? scopeId : null,
      },
    );

    return toFeatureOverrideResponseDto(deleted);
  }
}
