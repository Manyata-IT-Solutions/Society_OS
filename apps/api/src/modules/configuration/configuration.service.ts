import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigurationRegistry } from './configuration-registry.js';
import { ConfigurationRepository } from './configuration.repository.js';
import { ConfigurationResolverService } from './configuration-resolver.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import type {
  ConfigurationKeyDefinition,
  ConfigurationOverride,
  EffectiveConfiguration,
  ConfigurationScopeType,
} from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  SetConfigurationOverrideInput,
  GetConfigurationOverridesQueryInput,
} from '@community-os/validation';

export interface ActorContext {
  userId: string;
  organizationId?: string | null;
  communityId?: string | null;
  correlationId?: string;
}

@Injectable()
export class ConfigurationService {
  constructor(
    private readonly configRepo: ConfigurationRepository,
    private readonly configResolver: ConfigurationResolverService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  getRegistry(): ConfigurationKeyDefinition[] {
    return ConfigurationRegistry.getRegisteredKeys();
  }

  async getEffectiveConfig(
    context: { organizationId?: string; communityId?: string },
    keys?: string[],
    namespace?: string,
  ): Promise<EffectiveConfiguration[]> {
    if (keys && keys.length > 0) {
      return Promise.all(keys.map((k) => this.configResolver.resolve(k, context)));
    }
    if (namespace) {
      const defs = ConfigurationRegistry.getDefinitionsByNamespace(namespace);
      return Promise.all(defs.map((d) => this.configResolver.resolve(d.key, context)));
    }
    return this.configResolver.resolveAll(context);
  }

  async getOverrides(
    filter: GetConfigurationOverridesQueryInput,
  ): Promise<ConfigurationOverride[]> {
    return this.configRepo.findManyOverrides({
      organizationId: filter.organizationId,
      communityId: filter.communityId,
      scopeType: filter.scopeType,
      namespace: filter.namespace,
    });
  }

  async setOverride(
    input: SetConfigurationOverrideInput,
    actor: ActorContext,
  ): Promise<ConfigurationOverride> {
    // 1. Validate key and scope
    const keyDef = ConfigurationRegistry.getKeyDefinition(input.key);
    if (!keyDef) {
      throw new DomainException(
        'UNKNOWN_CONFIG_KEY',
        `Configuration key "${input.key}" is not registered in platform catalog`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!keyDef.allowedScopes.includes(input.scopeType)) {
      throw new DomainException(
        'CONFIG_SCOPE_NOT_ALLOWED',
        `Key "${input.key}" cannot be configured at scope "${input.scopeType}". Allowed: ${keyDef.allowedScopes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Validate value
    const validatedValue = ConfigurationRegistry.validateValue(
      input.key,
      input.value,
      input.scopeType,
    );

    const { override, previousValue } = await this.configRepo.upsertOverride({
      key: input.key,
      scopeType: input.scopeType,
      scopeId: input.scopeId || null,
      organizationId:
        input.scopeType === 'ORGANIZATION'
          ? input.scopeId
          : input.scopeType === 'COMMUNITY'
            ? actor.organizationId || null
            : null,
      communityId: input.scopeType === 'COMMUNITY' ? input.scopeId : null,
      value: validatedValue,
      changeReason: input.changeReason || null,
      actorId: actor.userId,
    });

    // 3. Invalidate cache
    await this.configResolver.invalidateCache(input.key, input.scopeType, input.scopeId);

    // 4. Emit Domain Event
    const isNew = previousValue === null;
    const eventName = isNew
      ? DOMAIN_EVENT_NAMES.CONFIGURATION_OVERRIDE_CREATED
      : DOMAIN_EVENT_NAMES.CONFIGURATION_OVERRIDE_UPDATED;

    await this.eventsService.publish(
      createEvent(
        eventName,
        {
          overrideId: override.id,
          key: override.key,
          scopeType: override.scopeType,
          scopeId: override.scopeId,
          organizationId: override.organizationId,
          communityId: override.communityId,
          previousValue,
          newValue: override.value,
          changeReason: override.changeReason,
          version: override.version,
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
      `Configuration override saved: ${override.key} at ${override.scopeType}:${override.scopeId} by ${actor.userId}`,
      'ConfigurationService',
    );

    return override;
  }

  async deleteOverride(
    key: string,
    scopeType: ConfigurationScopeType,
    scopeId: string | null,
    actor: ActorContext,
  ): Promise<ConfigurationOverride> {
    const deleted = await this.configRepo.deleteOverride(key, scopeType, scopeId);
    if (!deleted) {
      throw new DomainException(
        'CONFIG_OVERRIDE_NOT_FOUND',
        `No configuration override found for key "${key}" at scope "${scopeType}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Invalidate cache
    await this.configResolver.invalidateCache(key, scopeType, scopeId);

    // Emit event
    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.CONFIGURATION_OVERRIDE_REMOVED,
        {
          overrideId: deleted.id,
          key: deleted.key,
          scopeType: deleted.scopeType,
          scopeId: deleted.scopeId,
          organizationId: deleted.organizationId,
          communityId: deleted.communityId,
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
      `Configuration override removed: ${key} at ${scopeType}:${scopeId} by ${actor.userId}`,
      'ConfigurationService',
    );

    return deleted;
  }

  previewValidation(key: string, value: unknown, scopeType: ConfigurationScopeType) {
    const keyDef = ConfigurationRegistry.getKeyDefinition(key);
    if (!keyDef) {
      return { valid: false, error: `Unknown configuration key: "${key}"` };
    }

    if (!keyDef.allowedScopes.includes(scopeType)) {
      return {
        valid: false,
        error: `Key "${key}" cannot be configured at scope "${scopeType}". Allowed: ${keyDef.allowedScopes.join(', ')}`,
      };
    }

    try {
      const validatedValue = ConfigurationRegistry.validateValue(key, value, scopeType);
      return { valid: true, validatedValue };
    } catch (err: unknown) {
      return { valid: false, error: (err as Error).message };
    }
  }
}
