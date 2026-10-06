export type ISO8601String = string;

export type EntityStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

/**
 * Monetary representation to prevent floating point inaccuracies
 * Stored in minor currency units (e.g. cents, paise) as integer
 */
export interface Money {
  amountInMinorUnits: number;
  currency: string; // ISO 4217 (e.g. 'INR', 'USD')
}

/**
 * Internationalized Address Value Object
 */
export interface Address {
  addressLine1: string;
  addressLine2?: string | null;
  locality?: string | null;
  city: string;
  region?: string | null;
  postalCode: string;
  countryCode: string; // ISO 3166-1 alpha-2 / alpha-3
}

/**
 * Base domain entity interface
 */
export interface BaseEntity {
  id: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization Aggregate Domain Model
 */
export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  legalName?: string | null;
  status: EntityStatus;
  defaultTimezone: string;
  defaultLocale: string;
  defaultCurrency: string;
  settings: Record<string, unknown>;
}

/**
 * Community Aggregate Domain Model
 */
export interface Community extends BaseEntity {
  organizationId: string;
  name: string;
  code: string;
  slug: string;
  status: EntityStatus;
  timezone: string;
  locale: string;
  currency: string;
  address: Address;
  settings: Record<string, unknown>;
}

/**
 * Tenant-scoped domain entity
 */
export interface TenantEntity extends BaseEntity {
  organizationId: string;
  communityId?: string | null;
}

/**
 * Auditable domain entity
 */
export interface AuditableEntity extends TenantEntity {
  createdBy?: string | null;
  updatedBy?: string | null;
}

/**
 * Soft-deletable entity (where domain requirements justify it)
 */
export interface SoftDeletableEntity {
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export type Nullable<T> = T | null;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
