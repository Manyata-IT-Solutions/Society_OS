import { Injectable, HttpStatus } from '@nestjs/common';
import { CustomFieldDefinitionRepository } from './custom-field-definition.repository.js';
import { CustomFieldValueRepository } from './custom-field-value.repository.js';
import { CustomFieldValidatorService } from './custom-field-validator.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import type {
  CustomFieldDefinition,
  CustomFieldValue,
  CustomFieldEntityType,
} from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  CreateCustomFieldDefinitionInput,
  UpdateCustomFieldDefinitionInput,
  GetCustomFieldsQueryInput,
  SetCustomFieldValuesBulkInput,
} from '@community-os/validation';

export interface CustomFieldActorContext {
  userId: string;
  organizationId: string;
  communityId?: string | null;
  correlationId?: string;
}

@Injectable()
export class CustomFieldService {
  constructor(
    private readonly defRepo: CustomFieldDefinitionRepository,
    private readonly valRepo: CustomFieldValueRepository,
    private readonly validator: CustomFieldValidatorService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async getDefinitions(query: GetCustomFieldsQueryInput): Promise<CustomFieldDefinition[]> {
    return this.defRepo.findManyDefinitions(query);
  }

  async getDefinition(id: string): Promise<CustomFieldDefinition> {
    const def = await this.defRepo.findDefinitionById(id);
    if (!def) {
      throw new DomainException(
        'CUSTOM_FIELD_NOT_FOUND',
        `Custom field definition "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return def;
  }

  async createDefinition(
    input: CreateCustomFieldDefinitionInput,
    actor: CustomFieldActorContext,
  ): Promise<CustomFieldDefinition> {
    // 1. Check uniqueness of key per organization/community/entityType
    const existing = await this.defRepo.findDefinitionByKey(
      actor.organizationId,
      actor.communityId || null,
      input.entityType,
      input.key,
    );

    if (existing) {
      throw new DomainException(
        'DUPLICATE_CUSTOM_FIELD_KEY',
        `A custom field with key "${input.key}" already exists for ${input.entityType}`,
        HttpStatus.CONFLICT,
      );
    }

    // 2. Validate options if SELECT or MULTI_SELECT
    if (input.fieldType === 'SELECT' || input.fieldType === 'MULTI_SELECT') {
      if (!input.options || input.options.length === 0) {
        throw new DomainException(
          'OPTIONS_REQUIRED',
          `Field type "${input.fieldType}" requires at least one option`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const created = await this.defRepo.createDefinition({
      organizationId: actor.organizationId,
      communityId: actor.communityId || null,
      entityType: input.entityType,
      key: input.key,
      label: input.label,
      description: input.description || null,
      fieldType: input.fieldType,
      required: input.required ?? false,
      searchable: input.searchable ?? false,
      filterable: input.filterable ?? false,
      validationRules: (input.validationRules as Record<string, unknown>) || null,
      options: (input.options as unknown as Record<string, unknown>[]) || null,
      defaultValue: (input.defaultValue as unknown as string) || null,
      displayOrder: input.displayOrder ?? 0,
      visibility: input.visibility || 'TENANT_INTERNAL',
      actorId: actor.userId,
    });

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.CUSTOM_FIELD_CREATED,
        {
          definitionId: created.id,
          organizationId: created.organizationId,
          communityId: created.communityId,
          entityType: created.entityType,
          key: created.key,
          label: created.label,
          fieldType: created.fieldType,
        },
        {
          organizationId: created.organizationId,
          communityId: created.communityId || undefined,
          userId: actor.userId,
          correlationId: actor.correlationId,
        },
      ),
    );

    this.logger.log(
      `Custom field definition created: ${created.entityType}.${created.key} by ${actor.userId}`,
      'CustomFieldService',
    );

    return created;
  }

  async updateDefinition(
    id: string,
    input: UpdateCustomFieldDefinitionInput,
    actor: CustomFieldActorContext,
  ): Promise<CustomFieldDefinition> {
    const existing = await this.getDefinition(id);

    if (existing.organizationId !== actor.organizationId) {
      throw new DomainException(
        'CUSTOM_FIELD_SCOPE_DENIED',
        'Cannot update custom field from another organization',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.defRepo.updateDefinition(id, {
      label: input.label,
      description: input.description,
      required: input.required,
      searchable: input.searchable,
      filterable: input.filterable,
      validationRules: (input.validationRules as Record<string, unknown>) || undefined,
      options: (input.options as unknown as Record<string, unknown>[]) || undefined,
      defaultValue: (input.defaultValue as unknown as string) || undefined,
      displayOrder: input.displayOrder,
      visibility: input.visibility,
      status: input.status,
      expectedVersion: existing.version,
    });

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.CUSTOM_FIELD_UPDATED,
        {
          definitionId: updated.id,
          organizationId: updated.organizationId,
          communityId: updated.communityId,
          entityType: updated.entityType,
          key: updated.key,
          label: updated.label,
          status: updated.status,
          version: updated.version,
        },
        {
          organizationId: updated.organizationId,
          communityId: updated.communityId || undefined,
          userId: actor.userId,
          correlationId: actor.correlationId,
        },
      ),
    );

    return updated;
  }

  async archiveDefinition(
    id: string,
    actor: CustomFieldActorContext,
  ): Promise<CustomFieldDefinition> {
    const existing = await this.getDefinition(id);

    if (existing.organizationId !== actor.organizationId) {
      throw new DomainException(
        'CUSTOM_FIELD_SCOPE_DENIED',
        'Cannot archive custom field from another organization',
        HttpStatus.FORBIDDEN,
      );
    }

    const archived = await this.defRepo.updateDefinition(id, {
      status: 'ARCHIVED',
      expectedVersion: existing.version,
    });

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.CUSTOM_FIELD_ARCHIVED,
        {
          definitionId: archived.id,
          organizationId: archived.organizationId,
          communityId: archived.communityId,
          entityType: archived.entityType,
          key: archived.key,
        },
        {
          organizationId: archived.organizationId,
          communityId: archived.communityId || undefined,
          userId: actor.userId,
          correlationId: actor.correlationId,
        },
      ),
    );

    return archived;
  }

  async getEntityValues(
    entityType: CustomFieldEntityType,
    entityId: string,
    context: { organizationId: string; communityId?: string | null },
  ): Promise<{ definitions: CustomFieldDefinition[]; values: CustomFieldValue[] }> {
    const [definitions, values] = await Promise.all([
      this.defRepo.findActiveDefinitionsForEntity(
        context.organizationId,
        context.communityId || null,
        entityType,
      ),
      this.valRepo.findValuesForEntity(entityType, entityId),
    ]);

    return { definitions, values };
  }

  async setEntityValues(
    entityType: CustomFieldEntityType,
    entityId: string,
    input: SetCustomFieldValuesBulkInput,
    actor: {
      userId: string;
      organizationId: string | null;
      communityId?: string | null;
      correlationId?: string;
    },
  ): Promise<CustomFieldValue[]> {
    const results: CustomFieldValue[] = [];

    for (const item of input.values) {
      const definition = await this.defRepo.findDefinitionById(item.definitionId);
      if (!definition) {
        throw new DomainException(
          'CUSTOM_FIELD_NOT_FOUND',
          `Definition "${item.definitionId}" not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check tenant isolation
      if (actor.organizationId && definition.organizationId !== actor.organizationId) {
        throw new DomainException(
          'CUSTOM_FIELD_SCOPE_DENIED',
          'Cannot assign custom field value from a different organization',
          HttpStatus.FORBIDDEN,
        );
      }

      const targetOrgId = actor.organizationId || definition.organizationId;
      const targetCommId =
        actor.communityId !== undefined ? actor.communityId : definition.communityId;

      // Validate entity type match
      if (definition.entityType !== entityType) {
        throw new DomainException(
          'CUSTOM_FIELD_TYPE_INVALID',
          `Field "${definition.key}" applies to ${definition.entityType}, not ${entityType}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Strict server-side value validation
      const validatedValue = this.validator.validateValue(definition, item.value);

      const saved = await this.valRepo.upsertValue({
        definitionId: definition.id,
        organizationId: targetOrgId,
        communityId: targetCommId || null,
        entityType,
        entityId,
        value: validatedValue,
        actorId: actor.userId,
      });

      results.push(saved);
    }

    const eventOrgId = results[0]?.organizationId || actor.organizationId || '';
    const eventCommId = results[0]?.communityId || actor.communityId;

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.CUSTOM_FIELD_VALUE_UPDATED,
        {
          entityType,
          entityId,
          organizationId: eventOrgId,
          communityId: eventCommId,
          updatedCount: results.length,
        },
        {
          organizationId: eventOrgId,
          communityId: eventCommId || undefined,
          userId: actor.userId,
          correlationId: actor.correlationId,
        },
      ),
    );

    return results;
  }
}
