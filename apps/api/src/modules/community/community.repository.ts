import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { TenantScopedRepository } from '../database/tenant-scoped.repository.js';
import type { Community as PrismaComm } from '@prisma/client';
import type { Community, EntityStatus, TenantContext } from '@community-os/types';
import type {
  CreateCommunityInput,
  UpdateCommunityInput,
  CommunityQueryParams,
} from '@community-os/validation';
import { ConcurrencyConflictException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class CommunityRepository extends TenantScopedRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(ctx: TenantContext, id: string): Promise<Community | null> {
    const orgId = this.requireOrganizationScope(ctx);

    const comm = await this.prisma.community.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
    });

    return comm ? this.mapToDomain(comm) : null;
  }

  async findByIdUnscoped(id: string): Promise<Community | null> {
    const comm = await this.prisma.community.findUnique({
      where: { id },
    });
    return comm ? this.mapToDomain(comm) : null;
  }

  async findBySlug(ctx: TenantContext, slug: string): Promise<Community | null> {
    const orgId = this.requireOrganizationScope(ctx);

    const comm = await this.prisma.community.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
        organizationId: orgId,
      },
    });

    return comm ? this.mapToDomain(comm) : null;
  }

  async findByCode(ctx: TenantContext, code: string): Promise<Community | null> {
    const orgId = this.requireOrganizationScope(ctx);

    const comm = await this.prisma.community.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        organizationId: orgId,
      },
    });

    return comm ? this.mapToDomain(comm) : null;
  }

  async findMany(
    ctx: TenantContext,
    params: CommunityQueryParams,
  ): Promise<{ items: Community[]; total: number }> {
    const orgId = this.requireOrganizationScope(ctx);
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId: orgId,
    };

    if (status) {
      where['status'] = status;
    }

    if (search && search.trim() !== '') {
      where['OR'] = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { code: { contains: search.trim().toUpperCase(), mode: 'insensitive' } },
        { slug: { contains: search.trim().toLowerCase(), mode: 'insensitive' } },
        { city: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.community.count({ where }),
      this.prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      items: records.map((r) => this.mapToDomain(r)),
      total,
    };
  }

  async create(ctx: TenantContext, input: CreateCommunityInput): Promise<Community> {
    const orgId = this.requireOrganizationScope(ctx);

    const created = await this.prisma.community.create({
      data: {
        organizationId: orgId,
        name: input.name.trim(),
        code: input.code.toUpperCase().trim(),
        slug: input.slug.toLowerCase().trim(),
        status: 'ACTIVE',
        timezone: input.timezone || 'UTC',
        locale: input.locale || 'en-US',
        currency: input.currency || 'USD',
        addressLine1: input.address.addressLine1.trim(),
        addressLine2: input.address.addressLine2?.trim() || null,
        locality: input.address.locality?.trim() || null,
        city: input.address.city.trim(),
        region: input.address.region?.trim() || null,
        postalCode: input.address.postalCode.trim(),
        countryCode: input.address.countryCode.toUpperCase().trim(),
        settings: input.settings ? JSON.parse(JSON.stringify(input.settings)) : {},
        version: 1,
      },
    });

    return this.mapToDomain(created);
  }

  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateCommunityInput,
    expectedVersion?: number,
  ): Promise<Community> {
    const orgId = this.requireOrganizationScope(ctx);

    const current = await this.prisma.community.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!current) {
      return null as unknown as Community;
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConcurrencyConflictException('Community', id, current.version, expectedVersion);
    }

    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.name) data['name'] = input.name.trim();
    if (input.timezone) data['timezone'] = input.timezone;
    if (input.locale) data['locale'] = input.locale;
    if (input.currency) data['currency'] = input.currency;
    if (input.settings) data['settings'] = JSON.parse(JSON.stringify(input.settings));

    if (input.address) {
      if (input.address.addressLine1) data['addressLine1'] = input.address.addressLine1.trim();
      if (input.address.addressLine2 !== undefined)
        data['addressLine2'] = input.address.addressLine2?.trim() || null;
      if (input.address.locality !== undefined)
        data['locality'] = input.address.locality?.trim() || null;
      if (input.address.city) data['city'] = input.address.city.trim();
      if (input.address.region !== undefined) data['region'] = input.address.region?.trim() || null;
      if (input.address.postalCode) data['postalCode'] = input.address.postalCode.trim();
      if (input.address.countryCode)
        data['countryCode'] = input.address.countryCode.toUpperCase().trim();
    }

    const updated = await this.prisma.community.update({
      where: {
        id,
      },
      data,
    });

    return this.mapToDomain(updated);
  }

  async updateStatus(
    ctx: TenantContext,
    id: string,
    status: EntityStatus,
    expectedVersion?: number,
  ): Promise<Community> {
    const orgId = this.requireOrganizationScope(ctx);

    const current = await this.prisma.community.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!current) {
      return null as unknown as Community;
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConcurrencyConflictException('Community', id, current.version, expectedVersion);
    }

    const updated = await this.prisma.community.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
      },
    });

    return this.mapToDomain(updated);
  }

  private mapToDomain(record: PrismaComm): Community {
    return {
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      code: record.code,
      slug: record.slug,
      status: record.status as EntityStatus,
      timezone: record.timezone,
      locale: record.locale,
      currency: record.currency,
      address: {
        addressLine1: record.addressLine1,
        addressLine2: record.addressLine2,
        locality: record.locality,
        city: record.city,
        region: record.region,
        postalCode: record.postalCode,
        countryCode: record.countryCode,
      },
      settings: (record.settings as Record<string, unknown>) ?? {},
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
