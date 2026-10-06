import { Injectable, HttpStatus } from '@nestjs/common';
import { FeatureRegistry } from './feature-registry.js';
import { FeatureOverrideRepository } from './feature-override.repository.js';
import { FeatureResolverService } from './feature-resolver.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import type {
  FeatureDefinition,
  FeatureOverride,
  EffectiveFeature,
  FeatureScopeType,
} from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  SetFeatureOverrideInput,
  GetFeatureOverridesQueryInput,
} from '@community-os/validation';

export interface FeatureActorContext {
  userId: string;
  organizationId?: string | null;
  communityId?: string | null;
  correlationId?: string;
}

@Injectable()
export class FeatureFlagService {
  constructor(
    private readonly overrideRepo: FeatureOverrideRepository,
    private readonly featureResolver: FeatureResolverService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  getDefinitions(): FeatureDefinition[] {
    return FeatureRegistry.getDefinitions();
  }

  async getEffectiveFeatures(
    context: { organizationId?: string; communityId?: string },
    clientSafeOnly = false,
  ): Promise<EffectiveFeature[]> {
    return this.featureResolver.resolveAll(context, clientSafeOnly);
  }

  async getOverrides(filter: GetFeatureOverridesQueryInput): Promise<FeatureOverride[]> {
    return this.overrideRepo.findManyOverrides({
      organizationId: filter.organizationId,
      communityId: filter.communityId,
      scopeType: filter.scopeType,
    });
  }

  async setOverride(
    input: SetFeatureOverrideInput,
    actor: FeatureActorContext,
  ): Promise<FeatureOverride> {
    // 1. Check feature exists
    const def = FeatureRegistry.getDefinition(input.featureKey);
    if (!def) {
      throw new DomainException(
        'UNKNOWN_FEATURE',
        `Feature "${input.featureKey}" is not recognized in platform catalog`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Validate scope compatibility
    if (input.scopeType === 'COMMUNITY' && !input.scopeId) {
      throw new DomainException(
        'COMMUNITY_ID_REQUIRED',
        'communityId is required for COMMUNITY scope feature override',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.scopeType === 'ORGANIZATION' && !input.scopeId) {
      throw new DomainException(
        'ORGANIZATION_ID_REQUIRED',
        'organizationId is required for ORGANIZATION scope feature override',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { override, previousEnabled } = await this.overrideRepo.upsertOverride({
      featureKey: input.featureKey,
      scopeType: input.scopeType,
      scopeId: input.scopeId || null,
      organizationId:
        input.scopeType === 'ORGANIZATION'
          ? input.scopeId
          : input.scopeType === 'COMMUNITY'
            ? actor.organizationId || null
            : null,
      communityId: input.scopeType === 'COMMUNITY' ? input.scopeId : null,
      enabled: input.enabled,
      reason: input.reason || null,
      actorId: actor.userId,
    });

    // 3. Emit domain event
    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.FEATURE_OVERRIDE_CHANGED,
        {
          overrideId: override.id,
          featureKey: override.featureKey,
          scopeType: override.scopeType,
          scopeId: override.scopeId,
          organizationId: override.organizationId,
          communityId: override.communityId,
          enabled: override.enabled,
          previousEnabled,
          reason: override.reason,
        },
        {
          organizationId: override.organizationId || undefined,
          communityId: override.communityId || undefined,
          userId: actor.userId,
          correlationId: actor.correlationId,
        },
      ),
    );

    this.logger.log(
      `Feature override set: ${override.featureKey}=${override.enabled} at ${override.scopeType}:${override.scopeId} by ${actor.userId}`,
      'FeatureFlagService',
    );

    return override;
  }

  async deleteOverride(
    featureKey: string,
    scopeType: FeatureScopeType,
    scopeId: string | null,
    actor: FeatureActorContext,
  ): Promise<FeatureOverride> {
    const deleted = await this.overrideRepo.deleteOverride(featureKey, scopeType, scopeId);
    if (!deleted) {
      throw new DomainException(
        'FEATURE_OVERRIDE_NOT_FOUND',
        `No feature override found for "${featureKey}" at scope "${scopeType}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.FEATURE_OVERRIDE_CHANGED,
        {
          overrideId: deleted.id,
          featureKey: deleted.featureKey,
          scopeType: deleted.scopeType,
          scopeId: deleted.scopeId,
          organizationId: deleted.organizationId,
          communityId: deleted.communityId,
          enabled: false,
          previousEnabled: deleted.enabled,
          reason: 'Override removed',
        },
        {
          organizationId: deleted.organizationId || undefined,
          communityId: deleted.communityId || undefined,
          userId: actor.userId,
          correlationId: actor.correlationId,
        },
      ),
    );

    this.logger.log(
      `Feature override removed: ${featureKey} at ${scopeType}:${scopeId} by ${actor.userId}`,
      'FeatureFlagService',
    );

    return deleted;
  }
}
