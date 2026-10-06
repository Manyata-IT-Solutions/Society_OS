import type { EntityStatus, Organization } from '@community-os/types';
import type { PaginationQueryDto } from './common.dto.js';

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  legalName?: string | null;
  defaultTimezone?: string;
  defaultLocale?: string;
  defaultCurrency?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateOrganizationDto {
  name?: string;
  legalName?: string | null;
  defaultTimezone?: string;
  defaultLocale?: string;
  defaultCurrency?: string;
  settings?: Record<string, unknown>;
  expectedVersion?: number;
}

export interface ChangeOrganizationStatusDto {
  status: EntityStatus;
  expectedVersion?: number;
}

export interface OrganizationResponseDto {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  status: EntityStatus;
  defaultTimezone: string;
  defaultLocale: string;
  defaultCurrency: string;
  settings: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationQueryDto extends PaginationQueryDto {
  status?: EntityStatus;
  search?: string;
}

export function toOrganizationResponseDto(
  org: Organization | Record<string, unknown>,
): OrganizationResponseDto {
  const raw = org as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    name: raw['name'] as string,
    slug: raw['slug'] as string,
    legalName: (raw['legalName'] as string) ?? null,
    status: raw['status'] as EntityStatus,
    defaultTimezone: (raw['defaultTimezone'] as string) || 'UTC',
    defaultLocale: (raw['defaultLocale'] as string) || 'en-US',
    defaultCurrency: (raw['defaultCurrency'] as string) || 'USD',
    settings: (raw['settings'] as Record<string, unknown>) || {},
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
  };
}
