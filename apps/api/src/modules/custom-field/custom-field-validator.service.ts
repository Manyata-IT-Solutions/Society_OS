import { Injectable, HttpStatus } from '@nestjs/common';
import type { CustomFieldDefinition } from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class CustomFieldValidatorService {
  validateValue(definition: CustomFieldDefinition, value: unknown): unknown {
    // 1. Handle Null / Undefined
    if (value === null || value === undefined || value === '') {
      if (definition.required) {
        throw new DomainException(
          'CUSTOM_FIELD_REQUIRED',
          `Custom field "${definition.label}" (${definition.key}) is required.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return null;
    }

    const rules = definition.validationRules;

    // 2. Type-specific validations
    switch (definition.fieldType) {
      case 'TEXT':
      case 'LONG_TEXT': {
        if (typeof value !== 'string') {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects text.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const str = value.trim();
        if (rules?.minLength && str.length < rules.minLength) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" must be at least ${rules.minLength} characters.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (rules?.maxLength && str.length > rules.maxLength) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" must be at most ${rules.maxLength} characters.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (rules?.pattern) {
          try {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(str)) {
              throw new DomainException(
                'CUSTOM_FIELD_VALUE_INVALID',
                `Field "${definition.label}" does not match required format.`,
                HttpStatus.BAD_REQUEST,
              );
            }
          } catch {
            // If regex is invalid, bypass regex check safely
          }
        }
        return str;
      }

      case 'NUMBER': {
        const num = Number(value);
        if (!Number.isInteger(num)) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects an integer number.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (rules?.minValue !== undefined && num < rules.minValue) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" must be >= ${rules.minValue}.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (rules?.maxValue !== undefined && num > rules.maxValue) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" must be <= ${rules.maxValue}.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return num;
      }

      case 'DECIMAL': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects a numeric decimal value.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (rules?.minValue !== undefined && num < rules.minValue) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" must be >= ${rules.minValue}.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (rules?.maxValue !== undefined && num > rules.maxValue) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" must be <= ${rules.maxValue}.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return num;
      }

      case 'BOOLEAN': {
        if (typeof value !== 'boolean') {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects a boolean (true/false).`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value;
      }

      case 'DATE':
      case 'DATETIME': {
        const date = new Date(value as string);
        if (isNaN(date.getTime())) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects a valid ISO date string.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return date.toISOString();
      }

      case 'EMAIL': {
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects a valid email address.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value.trim().toLowerCase();
      }

      case 'PHONE': {
        if (typeof value !== 'string' || !/^\+?[0-9\s\-()]{7,25}$/.test(value)) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects a valid phone number.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value.trim();
      }

      case 'URL': {
        if (typeof value !== 'string' || !/^https?:\/\/.+/.test(value)) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects a valid web URL starting with http:// or https://.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value.trim();
      }

      case 'SELECT': {
        if (typeof value !== 'string') {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects a single choice option key.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const activeOptionKeys = (definition.options || [])
          .filter((opt) => opt.isActive)
          .map((opt) => opt.key);

        if (activeOptionKeys.length > 0 && !activeOptionKeys.includes(value)) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Invalid option "${value}" for field "${definition.label}". Allowed: ${activeOptionKeys.join(', ')}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return value;
      }

      case 'MULTI_SELECT': {
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
          throw new DomainException(
            'CUSTOM_FIELD_VALUE_INVALID',
            `Field "${definition.label}" expects an array of option keys.`,
            HttpStatus.BAD_REQUEST,
          );
        }
        const activeOptionKeys = (definition.options || [])
          .filter((opt) => opt.isActive)
          .map((opt) => opt.key);

        if (activeOptionKeys.length > 0) {
          for (const item of value) {
            if (!activeOptionKeys.includes(item)) {
              throw new DomainException(
                'CUSTOM_FIELD_VALUE_INVALID',
                `Invalid multi-select option "${item}" for field "${definition.label}". Allowed: ${activeOptionKeys.join(', ')}`,
                HttpStatus.BAD_REQUEST,
              );
            }
          }
        }
        return value;
      }

      default:
        return value;
    }
  }
}
