import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Organization as PrismaOrg } from '@prisma/client';
import type { Organization, EntityStatus } from '@community-os/types';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationQueryParams,
} from '@community-os/validation';
import { ConcurrencyConflictException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Organization | null> {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    });
    return org ? this.mapToDomain(org) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: slug.toLowerCase().trim() },
    });
    return org ? this.mapToDomain(org) : null;
  }

  async findMany(
    params: OrganizationQueryParams,
  ): Promise<{ items: Organization[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where['status'] = status;
    }

    if (search && search.trim() !== '') {
      where['OR'] = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { slug: { contains: search.trim().toLowerCase(), mode: 'insensitive' } },
        { legalName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
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

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const created = await this.prisma.organization.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.toLowerCase().trim(),
        legalName: input.legalName?.trim() || null,
        status: 'ACTIVE',
        defaultTimezone: input.defaultTimezone || 'UTC',
        defaultLocale: input.defaultLocale || 'en-US',
        defaultCurrency: input.defaultCurrency || 'USD',
        settings: input.settings ? JSON.parse(JSON.stringify(input.settings)) : {},
        version: 1,
      },
    });

    return this.mapToDomain(created);
  }

  async update(
    id: string,
    input: UpdateOrganizationInput,
    expectedVersion?: number,
  ): Promise<Organization> {
    const current = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!current) {
      return null as unknown as Organization;
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConcurrencyConflictException('Organization', id, current.version, expectedVersion);
    }

    const updated = await this.prisma.organization.update({
      where: {
        id,
        ...(expectedVersion !== undefined ? { version: expectedVersion } : {}),
      },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.legalName !== undefined ? { legalName: input.legalName?.trim() || null } : {}),
        ...(input.defaultTimezone ? { defaultTimezone: input.defaultTimezone } : {}),
        ...(input.defaultLocale ? { defaultLocale: input.defaultLocale } : {}),
        ...(input.defaultCurrency ? { defaultCurrency: input.defaultCurrency } : {}),
        ...(input.settings ? { settings: JSON.parse(JSON.stringify(input.settings)) } : {}),
        version: { increment: 1 },
      },
    });

    return this.mapToDomain(updated);
  }

  async updateStatus(
    id: string,
    status: EntityStatus,
    expectedVersion?: number,
  ): Promise<Organization> {
    const current = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!current) {
      return null as unknown as Organization;
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConcurrencyConflictException('Organization', id, current.version, expectedVersion);
    }

    const updated = await this.prisma.organization.update({
      where: {
        id,
        ...(expectedVersion !== undefined ? { version: expectedVersion } : {}),
      },
      data: {
        status,
        version: { increment: 1 },
      },
    });

    return this.mapToDomain(updated);
  }

  private mapToDomain(record: PrismaOrg): Organization {
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
      legalName: record.legalName,
      status: record.status as EntityStatus,
      defaultTimezone: record.defaultTimezone,
      defaultLocale: record.defaultLocale,
      defaultCurrency: record.defaultCurrency,
      settings: (record.settings as Record<string, unknown>) ?? {},
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
