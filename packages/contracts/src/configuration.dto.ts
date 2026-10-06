import type {
  ConfigurationKeyDefinition,
  ConfigurationOverride,
  EffectiveConfiguration,
  FeatureDefinition,
  FeatureOverride,
  EffectiveFeature,
  CustomFieldDefinition,
  CustomFieldValue,
  TerminologySettings,
  ConfigurationScopeType,
  ConfigurationValueType,
  ConfigurationStatus,
  ConfigurationSensitivity,
  FeatureScopeType,
  FeatureRolloutType,
  CustomFieldEntityType,
  CustomFieldType,
  CustomFieldStatus,
  CustomFieldVisibility,
  CustomFieldOption,
  CustomFieldValidationRules,
} from '@community-os/types';

export interface ConfigurationKeyDefinitionDto {
  key: string;
  namespace: string;
  description: string;
  valueType: ConfigurationValueType;
  defaultValue: unknown;
  allowedScopes: ConfigurationScopeType[];
  sensitivity: ConfigurationSensitivity;
  restartRequired?: boolean;
  isMutable?: boolean;
  isDeprecated?: boolean;
  allowedEnumValues?: string[];
}

export interface ConfigurationOverrideResponseDto {
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
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveConfigurationResponseDto {
  key: string;
  value: unknown;
  valueType: ConfigurationValueType;
  resolvedFrom: ConfigurationScopeType | 'DEFAULT';
  scopeId: string | null;
  isInherited: boolean;
  version: number;
  sensitivity: ConfigurationSensitivity;
}

export interface FeatureDefinitionDto {
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

export interface FeatureOverrideResponseDto {
  id: string;
  featureKey: string;
  scopeType: FeatureScopeType;
  scopeId: string | null;
  organizationId: string | null;
  communityId: string | null;
  enabled: boolean;
  reason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveFeatureResponseDto {
  key: string;
  enabled: boolean;
  resolvedFrom: FeatureScopeType | 'DEFAULT';
  scopeId: string | null;
  reason: string | null;
  dependenciesMet: boolean;
  isClientSafe: boolean;
}

export interface CustomFieldDefinitionResponseDto {
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
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldValueResponseDto {
  id: string;
  definitionId: string;
  organizationId: string;
  communityId: string | null;
  entityType: CustomFieldEntityType;
  entityId: string;
  value: unknown;
  version: number;
  createdAt: string;
  updatedAt: string;
  definition?: CustomFieldDefinitionResponseDto;
}

export interface TerminologySettingsResponseDto {
  sectionLabel: string;
  buildingLabel: string;
  unitLabel: string;
}

// -----------------------------------------------------------------------------
// Entity to DTO Mappers
// -----------------------------------------------------------------------------

export function toConfigurationKeyDefinitionDto(
  def: ConfigurationKeyDefinition,
): ConfigurationKeyDefinitionDto {
  return {
    key: def.key,
    namespace: def.namespace,
    description: def.description,
    valueType: def.valueType,
    defaultValue: def.defaultValue,
    allowedScopes: def.allowedScopes,
    sensitivity: def.sensitivity,
    restartRequired: def.restartRequired,
    isMutable: def.isMutable,
    isDeprecated: def.isDeprecated,
    allowedEnumValues: def.allowedEnumValues,
  };
}

export function toConfigurationOverrideResponseDto(
  override: ConfigurationOverride,
): ConfigurationOverrideResponseDto {
  return {
    id: override.id,
    key: override.key,
    scopeType: override.scopeType,
    scopeId: override.scopeId,
    organizationId: override.organizationId,
    communityId: override.communityId,
    value: override.value,
    version: override.version,
    status: override.status,
    changeReason: override.changeReason,
    createdById: override.createdById,
    updatedById: override.updatedById,
    createdAt:
      override.createdAt instanceof Date
        ? override.createdAt.toISOString()
        : String(override.createdAt),
    updatedAt:
      override.updatedAt instanceof Date
        ? override.updatedAt.toISOString()
        : String(override.updatedAt),
  };
}

export function toEffectiveConfigurationResponseDto(
  effective: EffectiveConfiguration,
): EffectiveConfigurationResponseDto {
  return {
    key: effective.key,
    value: effective.value,
    valueType: effective.valueType,
    resolvedFrom: effective.resolvedFrom,
    scopeId: effective.scopeId,
    isInherited: effective.isInherited,
    version: effective.version,
    sensitivity: effective.sensitivity,
  };
}

export function toFeatureDefinitionDto(def: FeatureDefinition): FeatureDefinitionDto {
  return {
    key: def.key,
    name: def.name,
    description: def.description,
    category: def.category,
    defaultEnabled: def.defaultEnabled,
    allowedScopes: def.allowedScopes,
    rolloutType: def.rolloutType,
    dependencies: def.dependencies,
    isClientSafe: def.isClientSafe,
  };
}

export function toFeatureOverrideResponseDto(
  override: FeatureOverride,
): FeatureOverrideResponseDto {
  return {
    id: override.id,
    featureKey: override.featureKey,
    scopeType: override.scopeType,
    scopeId: override.scopeId,
    organizationId: override.organizationId,
    communityId: override.communityId,
    enabled: override.enabled,
    reason: override.reason,
    version: override.version,
    createdAt:
      override.createdAt instanceof Date
        ? override.createdAt.toISOString()
        : String(override.createdAt),
    updatedAt:
      override.updatedAt instanceof Date
        ? override.updatedAt.toISOString()
        : String(override.updatedAt),
  };
}

export function toEffectiveFeatureResponseDto(
  effective: EffectiveFeature,
): EffectiveFeatureResponseDto {
  return {
    key: effective.key,
    enabled: effective.enabled,
    resolvedFrom: effective.resolvedFrom,
    scopeId: effective.scopeId,
    reason: effective.reason,
    dependenciesMet: effective.dependenciesMet,
    isClientSafe: effective.isClientSafe,
  };
}

export function toCustomFieldDefinitionResponseDto(
  def: CustomFieldDefinition,
): CustomFieldDefinitionResponseDto {
  return {
    id: def.id,
    organizationId: def.organizationId,
    communityId: def.communityId,
    entityType: def.entityType,
    key: def.key,
    label: def.label,
    description: def.description,
    fieldType: def.fieldType,
    required: def.required,
    searchable: def.searchable,
    filterable: def.filterable,
    status: def.status,
    validationRules: def.validationRules,
    options: def.options,
    defaultValue: def.defaultValue,
    displayOrder: def.displayOrder,
    visibility: def.visibility,
    version: def.version,
    createdAt: def.createdAt instanceof Date ? def.createdAt.toISOString() : String(def.createdAt),
    updatedAt: def.updatedAt instanceof Date ? def.updatedAt.toISOString() : String(def.updatedAt),
  };
}

export function toCustomFieldValueResponseDto(
  val: CustomFieldValue,
  definition?: CustomFieldDefinition,
): CustomFieldValueResponseDto {
  return {
    id: val.id,
    definitionId: val.definitionId,
    organizationId: val.organizationId,
    communityId: val.communityId,
    entityType: val.entityType,
    entityId: val.entityId,
    value: val.value,
    version: val.version,
    createdAt: val.createdAt instanceof Date ? val.createdAt.toISOString() : String(val.createdAt),
    updatedAt: val.updatedAt instanceof Date ? val.updatedAt.toISOString() : String(val.updatedAt),
    ...(definition && { definition: toCustomFieldDefinitionResponseDto(definition) }),
  };
}

export function toTerminologySettingsResponseDto(
  settings: TerminologySettings,
): TerminologySettingsResponseDto {
  return {
    sectionLabel: settings.sectionLabel,
    buildingLabel: settings.buildingLabel,
    unitLabel: settings.unitLabel,
  };
}
