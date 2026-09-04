import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigurationRegistry } from './configuration-registry.js';
import { ConfigurationRepository } from './configuration.repository.js';
import { RedisService } from '../redis/redis.service.js';
import { LoggerService } from '../logger/logger.service.js';
import type { EffectiveConfiguration, ConfigurationScopeType } from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

export interface ResolutionContext {
  organizationId?: string | null;
  communityId?: string | null;
}

@Injectable()
export class ConfigurationResolverService {
  private readonly CACHE_TTL_SECONDS = 300; // 5 minutes

  constructor(
    private readonly configRepo: ConfigurationRepository,
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Resolve effective typed value for a single configuration key according to strict hierarchy:
   * Community Override -> Organization Override -> Platform Override -> Registry Default
   */
  async resolve<T = unknown>(
    key: string,
    context: ResolutionContext = {},
  ): Promise<EffectiveConfiguration<T>> {
    const def = ConfigurationRegistry.getKeyDefinition(key);
    if (!def) {
      throw new DomainException(
        'CONFIG_KEY_NOT_FOUND',
        `Unknown configuration key: "${key}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    const orgId = context.organizationId || 'global';
    const commId = context.communityId || 'none';
    const cacheKey = `cfg:${orgId}:${commId}:${key}`;

    // 1. Try Redis cache
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as EffectiveConfiguration<T>;
      }
    } catch {
      // Safe fallback to DB resolution if Redis error
    }

    // 2. Resolve hierarchically
    let effective: EffectiveConfiguration<T> | null = null;

    // A. Community Override
    if (context.communityId && def.allowedScopes.includes('COMMUNITY')) {
      const commOverride = await this.configRepo.findOverride(
        key,
        'COMMUNITY',
        context.communityId,
      );
      if (commOverride && commOverride.status === 'ACTIVE') {
        effective = {
          key,
          value: commOverride.value as T,
          valueType: def.valueType,
          resolvedFrom: 'COMMUNITY',
          scopeId: context.communityId,
          isInherited: false,
          version: commOverride.version,
          sensitivity: def.sensitivity,
        };
      }
    }

    // B. Organization Override
    if (!effective && context.organizationId && def.allowedScopes.includes('ORGANIZATION')) {
      const orgOverride = await this.configRepo.findOverride(
        key,
        'ORGANIZATION',
        context.organizationId,
      );
      if (orgOverride && orgOverride.status === 'ACTIVE') {
        effective = {
          key,
          value: orgOverride.value as T,
          valueType: def.valueType,
          resolvedFrom: 'ORGANIZATION',
          scopeId: context.organizationId,
          isInherited: context.communityId !== undefined && context.communityId !== null,
          version: orgOverride.version,
          sensitivity: def.sensitivity,
        };
      }
    }

    // C. Platform Override
    if (!effective && def.allowedScopes.includes('PLATFORM')) {
      const platformOverride = await this.configRepo.findOverride(key, 'PLATFORM', null);
      if (platformOverride && platformOverride.status === 'ACTIVE') {
        effective = {
          key,
          value: platformOverride.value as T,
          valueType: def.valueType,
          resolvedFrom: 'PLATFORM',
          scopeId: null,
          isInherited: Boolean(context.organizationId || context.communityId),
          version: platformOverride.version,
          sensitivity: def.sensitivity,
        };
      }
    }

    // D. Registry Default Value
    if (!effective) {
      effective = {
        key,
        value: def.defaultValue as T,
        valueType: def.valueType,
        resolvedFrom: 'DEFAULT',
        scopeId: null,
        isInherited: true,
        version: 1,
        sensitivity: def.sensitivity,
      };
    }

    // 3. Cache the resolved result
    try {
      await this.redis.set(cacheKey, JSON.stringify(effective), this.CACHE_TTL_SECONDS);
    } catch {
      // ignore caching errors
    }

    return effective;
  }

  /**
   * Resolve multiple configuration keys in parallel.
   */
  async resolveMany(
    keys: string[],
    context: ResolutionContext = {},
  ): Promise<Record<string, EffectiveConfiguration>> {
    const results = await Promise.all(keys.map((k) => this.resolve(k, context)));
    const map: Record<string, EffectiveConfiguration> = {};
    for (const res of results) {
      map[res.key] = res;
    }
    return map;
  }

  /**
   * Resolve all keys in a given namespace.
   */
  async resolveNamespace(
    namespace: string,
    context: ResolutionContext = {},
  ): Promise<Record<string, EffectiveConfiguration>> {
    const defs = ConfigurationRegistry.getDefinitionsByNamespace(namespace);
    return this.resolveMany(
      defs.map((d) => d.key),
      context,
    );
  }

  /**
   * Resolve all registered configuration keys.
   */
  async resolveAll(context: ResolutionContext = {}): Promise<EffectiveConfiguration[]> {
    const defs = ConfigurationRegistry.getRegisteredKeys();
    return Promise.all(defs.map((d) => this.resolve(d.key, context)));
  }

  /**
   * Invalidate cached resolution entries for a key across all affected contexts.
   */
  async invalidateCache(
    key: string,
    scopeType: ConfigurationScopeType,
    scopeId?: string | null,
  ): Promise<void> {
    try {
      let pattern = `cfg:*:${key}`;
      if (scopeType === 'COMMUNITY' && scopeId) {
        pattern = `cfg:*:${scopeId}:${key}`;
      } else if (scopeType === 'ORGANIZATION' && scopeId) {
        pattern = `cfg:${scopeId}:*:${key}`;
      }
      await this.redis.delPattern(pattern);
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate config cache for ${key}: ${(err as Error).message}`,
        'ConfigResolver',
      );
    }
  }
}
