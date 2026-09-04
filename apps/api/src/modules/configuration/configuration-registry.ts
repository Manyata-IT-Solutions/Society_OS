import { HttpStatus } from '@nestjs/common';
import type { ConfigurationKeyDefinition, ConfigurationScopeType } from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

export class ConfigurationRegistry {
  private static readonly REGISTRY: Map<string, ConfigurationKeyDefinition<unknown>> = new Map();

  static {
    // ---------------------------------------------------------------------------
    // 1. Platform & General
    // ---------------------------------------------------------------------------
    this.register<string>({
      key: 'platform.defaultTimezone',
      namespace: 'platform',
      description: 'Default timezone for platform date calculations and scheduling',
      valueType: 'STRING',
      defaultValue: 'UTC',
      allowedScopes: ['PLATFORM'],
      sensitivity: 'PUBLIC_CLIENT',
    });

    this.register<string>({
      key: 'platform.defaultLocale',
      namespace: 'platform',
      description: 'Default language locale for platform internationalization',
      valueType: 'STRING',
      defaultValue: 'en-US',
      allowedScopes: ['PLATFORM'],
      sensitivity: 'PUBLIC_CLIENT',
    });

    // ---------------------------------------------------------------------------
    // 2. Property Terminology
    // ---------------------------------------------------------------------------
    this.register<string>({
      key: 'community.display.sectionLabel',
      namespace: 'community',
      description: 'Display terminology for Community Section (e.g. Section, Phase, Sector, Zone)',
      valueType: 'STRING',
      defaultValue: 'Section',
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      sensitivity: 'PUBLIC_CLIENT',
    });

    this.register<string>({
      key: 'community.display.buildingLabel',
      namespace: 'community',
      description: 'Display terminology for Building (e.g. Building, Tower, Block, Wing)',
      valueType: 'STRING',
      defaultValue: 'Building',
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      sensitivity: 'PUBLIC_CLIENT',
    });

    this.register<string>({
      key: 'community.display.unitLabel',
      namespace: 'community',
      description: 'Display terminology for Unit (e.g. Unit, Flat, Apartment, Residence, Villa)',
      valueType: 'STRING',
      defaultValue: 'Unit',
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      sensitivity: 'PUBLIC_CLIENT',
    });

    // ---------------------------------------------------------------------------
    // 3. Document Core Settings
    // ---------------------------------------------------------------------------
    this.register<number>({
      key: 'document.maxUploadSizeMb',
      namespace: 'document',
      description: 'Maximum allowable single document upload size in megabytes',
      valueType: 'INTEGER',
      defaultValue: 25,
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      sensitivity: 'INTERNAL',
    });

    this.register<string[]>({
      key: 'document.allowedMimeTypes',
      namespace: 'document',
      description: 'Permitted document MIME types for upload ingestion',
      valueType: 'STRING_LIST',
      defaultValue: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      allowedScopes: ['PLATFORM', 'ORGANIZATION'],
      sensitivity: 'INTERNAL',
    });

    // ---------------------------------------------------------------------------
    // 4. Resident Settings
    // ---------------------------------------------------------------------------
    this.register<boolean>({
      key: 'resident.allowSelfProfileEdit',
      namespace: 'resident',
      description: 'Allow residents to edit their contact details via self-service portal',
      valueType: 'BOOLEAN',
      defaultValue: true,
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      sensitivity: 'PUBLIC_CLIENT',
    });

    // ---------------------------------------------------------------------------
    // 5. Notification Settings
    // ---------------------------------------------------------------------------
    this.register<string>({
      key: 'notification.defaultLocale',
      namespace: 'notification',
      description: 'Default language template locale for automated notifications',
      valueType: 'STRING',
      defaultValue: 'en',
      allowedScopes: ['PLATFORM', 'ORGANIZATION', 'COMMUNITY'],
      sensitivity: 'PUBLIC_CLIENT',
    });

    // ---------------------------------------------------------------------------
    // 6. Security Settings
    // ---------------------------------------------------------------------------
    this.register<number>({
      key: 'security.sessionTimeoutMinutes',
      namespace: 'security',
      description: 'Idle session timeout in minutes before requiring re-authentication',
      valueType: 'INTEGER',
      defaultValue: 1440,
      allowedScopes: ['PLATFORM', 'ORGANIZATION'],
      sensitivity: 'INTERNAL',
    });
  }

  private static register<T>(definition: ConfigurationKeyDefinition<T>): void {
    this.REGISTRY.set(definition.key, definition);
  }

  static getRegisteredKeys(): ConfigurationKeyDefinition[] {
    return Array.from(this.REGISTRY.values());
  }

  static getKeyDefinition(key: string): ConfigurationKeyDefinition | null {
    return this.REGISTRY.get(key) || null;
  }

  static getDefinitionsByNamespace(namespace: string): ConfigurationKeyDefinition[] {
    return Array.from(this.REGISTRY.values()).filter((def) => def.namespace === namespace);
  }

  static validateValue(key: string, value: unknown, scopeType: ConfigurationScopeType): unknown {
    const def = this.getKeyDefinition(key);
    if (!def) {
      throw new DomainException(
        'CONFIG_KEY_NOT_FOUND',
        `Unknown configuration key: "${key}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!def.allowedScopes.includes(scopeType)) {
      throw new DomainException(
        'CONFIG_SCOPE_NOT_ALLOWED',
        `Configuration key "${key}" cannot be overridden at scope "${scopeType}". Allowed scopes: ${def.allowedScopes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Type validation
    switch (def.valueType) {
      case 'BOOLEAN': {
        if (typeof value !== 'boolean') {
          throw new DomainException(
            'CONFIG_VALUE_INVALID',
            `Configuration key "${key}" expects a BOOLEAN value, received ${typeof value}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value;
      }
      case 'INTEGER': {
        const num = Number(value);
        if (!Number.isInteger(num)) {
          throw new DomainException(
            'CONFIG_VALUE_INVALID',
            `Configuration key "${key}" expects an INTEGER value, received ${value}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return num;
      }
      case 'DECIMAL': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new DomainException(
            'CONFIG_VALUE_INVALID',
            `Configuration key "${key}" expects a numeric DECIMAL value, received ${value}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return num;
      }
      case 'STRING': {
        if (typeof value !== 'string' || value.trim().length === 0) {
          throw new DomainException(
            'CONFIG_VALUE_INVALID',
            `Configuration key "${key}" expects a non-empty STRING value`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value.trim();
      }
      case 'STRING_LIST': {
        if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
          throw new DomainException(
            'CONFIG_VALUE_INVALID',
            `Configuration key "${key}" expects an array of strings`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value;
      }
      case 'ENUM': {
        if (
          typeof value !== 'string' ||
          (def.allowedEnumValues && !def.allowedEnumValues.includes(value))
        ) {
          throw new DomainException(
            'CONFIG_VALUE_INVALID',
            `Configuration key "${key}" expects one of: ${def.allowedEnumValues?.join(', ')}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value;
      }
      case 'JSON_OBJECT': {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new DomainException(
            'CONFIG_VALUE_INVALID',
            `Configuration key "${key}" expects a valid JSON object`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value;
      }
      case 'DURATION': {
        if (typeof value !== 'string' && typeof value !== 'number') {
          throw new DomainException(
            'CONFIG_VALUE_INVALID',
            `Configuration key "${key}" expects a DURATION value (e.g. "30d", "12h" or milliseconds)`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value;
      }
      default:
        return value;
    }
  }
}
