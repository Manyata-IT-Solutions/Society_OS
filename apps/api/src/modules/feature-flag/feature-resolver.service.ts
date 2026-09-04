import { Injectable, HttpStatus } from '@nestjs/common';
import { FeatureRegistry } from './feature-registry.js';
import { FeatureOverrideRepository } from './feature-override.repository.js';
import type { EffectiveFeature } from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

export interface FeatureResolutionContext {
  organizationId?: string | null;
  communityId?: string | null;
}

@Injectable()
export class FeatureResolverService {
  constructor(private readonly overrideRepo: FeatureOverrideRepository) {}

  async resolve(key: string, context: FeatureResolutionContext = {}): Promise<EffectiveFeature> {
    const def = FeatureRegistry.getDefinition(key);
    if (!def) {
      throw new DomainException(
        'FEATURE_NOT_FOUND',
        `Unknown feature key: "${key}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    let enabled = def.defaultEnabled;
    let resolvedFrom: EffectiveFeature['resolvedFrom'] = 'DEFAULT';
    let scopeId: string | null = null;
    let reason: string | null = null;

    // 1. Check Platform override
    const platformOverride = await this.overrideRepo.findOverride(key, 'PLATFORM', null);
    if (platformOverride) {
      enabled = platformOverride.enabled;
      resolvedFrom = 'PLATFORM';
      scopeId = null;
      reason = platformOverride.reason;
    }

    // 2. Check Organization override
    if (context.organizationId && def.allowedScopes.includes('ORGANIZATION')) {
      const orgOverride = await this.overrideRepo.findOverride(
        key,
        'ORGANIZATION',
        context.organizationId,
      );
      if (orgOverride) {
        enabled = orgOverride.enabled;
        resolvedFrom = 'ORGANIZATION';
        scopeId = context.organizationId;
        reason = orgOverride.reason;
      }
    }

    // 3. Check Community override
    if (context.communityId && def.allowedScopes.includes('COMMUNITY')) {
      const commOverride = await this.overrideRepo.findOverride(
        key,
        'COMMUNITY',
        context.communityId,
      );
      if (commOverride) {
        enabled = commOverride.enabled;
        resolvedFrom = 'COMMUNITY';
        scopeId = context.communityId;
        reason = commOverride.reason;
      }
    }

    // 4. Validate Dependencies
    let dependenciesMet = true;
    if (def.dependencies && def.dependencies.length > 0) {
      for (const depKey of def.dependencies) {
        const depResolved = await this.resolve(depKey, context);
        if (!depResolved.enabled) {
          dependenciesMet = false;
          enabled = false;
          reason = `Disabled due to unmet dependency: "${depKey}"`;
          break;
        }
      }
    }

    return {
      key,
      enabled,
      resolvedFrom,
      scopeId,
      reason,
      dependenciesMet,
      isClientSafe: Boolean(def.isClientSafe),
    };
  }

  async resolveAll(
    context: FeatureResolutionContext = {},
    clientSafeOnly = false,
  ): Promise<EffectiveFeature[]> {
    const defs = FeatureRegistry.getDefinitions();
    const results = await Promise.all(defs.map((d) => this.resolve(d.key, context)));

    if (clientSafeOnly) {
      return results.filter((r) => r.isClientSafe);
    }

    return results;
  }
}
