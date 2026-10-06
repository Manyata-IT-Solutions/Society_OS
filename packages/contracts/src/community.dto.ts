import type { Address, Community, EntityStatus } from '@community-os/types';
import type { PaginationQueryDto } from './common.dto.js';

export interface CreateCommunityDto {
  name: string;
  code: string;
  slug: string;
  timezone?: string;
  locale?: string;
  currency?: string;
  address: Address;
  settings?: Record<string, unknown>;
}

export interface UpdateCommunityDto {
  name?: string;
  timezone?: string;
  locale?: string;
  currency?: string;
  address?: Partial<Address>;
  settings?: Record<string, unknown>;
  expectedVersion?: number;
}

export interface ChangeCommunityStatusDto {
  status: EntityStatus;
  expectedVersion?: number;
}

export interface CommunityResponseDto {
  id: string;
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
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityQueryDto extends PaginationQueryDto {
  organizationId?: string;
  status?: EntityStatus;
  search?: string;
}

export function toCommunityResponseDto(
  comm: Community | Record<string, unknown>,
): CommunityResponseDto {
  const raw = comm as Record<string, unknown>;
  const address: Address =
    'address' in raw && raw['address'] && typeof raw['address'] === 'object'
      ? (raw['address'] as Address)
      : {
          addressLine1: (raw['addressLine1'] as string) || (raw['address_line_1'] as string) || '',
          addressLine2:
            (raw['addressLine2'] as string) || (raw['address_line_2'] as string) || null,
          locality: (raw['locality'] as string) || null,
          city: (raw['city'] as string) || '',
          region: (raw['region'] as string) || null,
          postalCode: (raw['postalCode'] as string) || (raw['postal_code'] as string) || '',
          countryCode: (raw['countryCode'] as string) || (raw['country_code'] as string) || 'US',
        };

  return {
    id: raw['id'] as string,
    organizationId: (raw['organizationId'] as string) || (raw['organization_id'] as string),
    name: raw['name'] as string,
    code: raw['code'] as string,
    slug: raw['slug'] as string,
    status: raw['status'] as EntityStatus,
    timezone: raw['timezone'] as string,
    locale: raw['locale'] as string,
    currency: raw['currency'] as string,
    address,
    settings: (raw['settings'] as Record<string, unknown>) ?? {},
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
  };
}
