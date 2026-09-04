/**
 * Configuration, Feature Flags & Custom Fields Domain Types
 */

export type ConfigurationScopeType = 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY';

export type ConfigurationValueType =
  | 'BOOLEAN'
  | 'STRING'
  | 'INTEGER'
  | 'DECIMAL'
  | 'ENUM'
  | 'STRING_LIST'
  | 'JSON_OBJECT'
  | 'DURATION';

export type ConfigurationStatus = 'ACTIVE' | 'DISABLED' | 'DEPRECATED';

export type ConfigurationSensitivity = 'PUBLIC_CLIENT' | 'INTERNAL' | 'ADMIN_ONLY' | 'RESTRICTED';

export interface ConfigurationKeyDefinition<T = unknown> {
  key: string;
  namespace: string;
  description: string;
  valueType: ConfigurationValueType;
  defaultValue: T;
  allowedScopes: ConfigurationScopeType[];
  sensitivity: ConfigurationSensitivity;
  restartRequired?: boolean;
  isMutable?: boolean;
  isDeprecated?: boolean;
  allowedEnumValues?: string[];
}

export interface ConfigurationOverride {
  id: string;
  key: string;
  scopeType: ConfigurationScopeType;
  scopeId: string | null;
  organizationId: string | null;
  communityId: string | null;
  value: unknown;
  version: number;
  status: ConfigurationStatus;
  changeReason: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EffectiveConfiguration<T = unknown> {
  key: string;
  value: T;
  valueType: ConfigurationValueType;
  resolvedFrom: ConfigurationScopeType | 'DEFAULT';
  scopeId: string | null;
  isInherited: boolean;
  version: number;
  sensitivity: ConfigurationSensitivity;
}

// -----------------------------------------------------------------------------
// Feature Flags & Entitlements
// -----------------------------------------------------------------------------

export type FeatureScopeType = 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY';

export type FeatureRolloutType = 'BOOLEAN_TOGGLE' | 'PERCENTAGE' | 'ALLOWLIST';

export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  category: string;
  defaultEnabled: boolean;
  allowedScopes: FeatureScopeType[];
  rolloutType: FeatureRolloutType;
  dependencies?: string[];
  isClientSafe?: boolean;
}

export interface FeatureOverride {
  id: string;
  featureKey: string;
  scopeType: FeatureScopeType;
  scopeId: string | null;
  organizationId: string | null;
  communityId: string | null;
  enabled: boolean;
  reason: string | null;
  version: number;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EffectiveFeature {
  key: string;
  enabled: boolean;
  resolvedFrom: FeatureScopeType | 'DEFAULT';
  scopeId: string | null;
  reason: string | null;
  dependenciesMet: boolean;
  isClientSafe: boolean;
}

// -----------------------------------------------------------------------------
// Custom Fields
// -----------------------------------------------------------------------------

export type CustomFieldEntityType =
  | 'COMMUNITY'
  | 'BUILDING'
  | 'UNIT'
  | 'RESIDENT'
  | 'HOUSEHOLD'
  | 'DOCUMENT'
  | 'TICKET'
  | 'WORK_ORDER'
  | 'MAINTENANCE_PLAN'
  | 'ASSET';

export type CustomFieldType =
  | 'TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'EMAIL'
  | 'PHONE'
  | 'URL';

export type CustomFieldStatus = 'ACTIVE' | 'ARCHIVED';

export type CustomFieldVisibility = 'PUBLIC' | 'TENANT_INTERNAL' | 'ADMIN_ONLY' | 'RESTRICTED';

export interface CustomFieldOption {
  key: string;
  label: string;
  isActive: boolean;
}

export interface CustomFieldValidationRules {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  allowedValues?: string[];
}

export interface CustomFieldDefinition {
  id: string;
  organizationId: string;
  communityId: string | null;
  entityType: CustomFieldEntityType;
  key: string;
  label: string;
  description: string | null;
  fieldType: CustomFieldType;
  required: boolean;
  searchable: boolean;
  filterable: boolean;
  status: CustomFieldStatus;
  validationRules: CustomFieldValidationRules | null;
  options: CustomFieldOption[] | null;
  defaultValue: unknown;
  displayOrder: number;
  visibility: CustomFieldVisibility;
  version: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomFieldValue {
  id: string;
  definitionId: string;
  organizationId: string;
  communityId: string | null;
  entityType: CustomFieldEntityType;
  entityId: string;
  value: unknown;
  version: number;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomFieldValueWithDefinition {
  fieldKey: string;
  label: string;
  fieldType: CustomFieldType;
  value: unknown;
  visibility: CustomFieldVisibility;
  required: boolean;
}

// -----------------------------------------------------------------------------
// Terminology & Display Templates
// -----------------------------------------------------------------------------

export interface TerminologySettings {
  sectionLabel: string;
  buildingLabel: string;
  unitLabel: string;
}
