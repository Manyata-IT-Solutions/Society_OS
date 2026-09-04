import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  ConfigurationOverride,
  ConfigurationScopeType,
  ConfigurationStatus,
} from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { Prisma } from '@prisma/client';

export interface SetOverrideData {
  key: string;
  scopeType: ConfigurationScopeType;
  scopeId?: string | null;
  organizationId?: string | null;
  communityId?: string | null;
  value: unknown;
  status?: ConfigurationStatus;
  changeReason?: string | null;
  actorId?: string | null;
  expectedVersion?: number;
}

@Injectable()
export class ConfigurationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOverride(
    key: string,
    scopeType: ConfigurationScopeType,
    scopeId?: string | null,
  ): Promise<ConfigurationOverride | null> {
    const override = await this.prisma.configurationOverride.findFirst({
      where: {
        key,
        scopeType,
        scopeId: scopeId || null,
      },
    });

    return (override as unknown as ConfigurationOverride) || null;
  }

  async findManyOverrides(params: {
    organizationId?: string;
    communityId?: string;
    scopeType?: ConfigurationScopeType;
    namespace?: string;
  }): Promise<ConfigurationOverride[]> {
    const where: Prisma.ConfigurationOverrideWhereInput = {};

    if (params.scopeType) where.scopeType = params.scopeType;
    if (params.organizationId) where.organizationId = params.organizationId;
    if (params.communityId) where.communityId = params.communityId;
    if (params.namespace) {
      where.key = { startsWith: `${params.namespace}.` };
    }

    const items = await this.prisma.configurationOverride.findMany({
      where,
      orderBy: [{ key: 'asc' }, { scopeType: 'asc' }],
    });

    return items as unknown as ConfigurationOverride[];
  }

  async upsertOverride(
    data: SetOverrideData,
  ): Promise<{ override: ConfigurationOverride; previousValue: unknown | null }> {
    const existing = await this.findOverride(data.key, data.scopeType, data.scopeId);

    if (existing) {
      // Optimistic concurrency check
      if (data.expectedVersion !== undefined && existing.version !== data.expectedVersion) {
        throw new DomainException(
          'CONFIG_CONFLICT',
          `Configuration conflict: Expected version ${data.expectedVersion}, but current version is ${existing.version}`,
          HttpStatus.CONFLICT,
        );
      }

      const updated = await this.prisma.configurationOverride.update({
        where: { id: existing.id },
        data: {
          value: data.value as Prisma.InputJsonValue,
          status: data.status || 'ACTIVE',
          changeReason: data.changeReason || null,
          updatedById: data.actorId || null,
          version: { increment: 1 },
        },
      });

      return {
        override: updated as unknown as ConfigurationOverride,
        previousValue: existing.value,
      };
    }

    const created = await this.prisma.configurationOverride.create({
      data: {
        key: data.key,
        scopeType: data.scopeType,
        scopeId: data.scopeId || null,
        organizationId: data.organizationId || null,
        communityId: data.communityId || null,
        value: data.value as Prisma.InputJsonValue,
        status: data.status || 'ACTIVE',
        changeReason: data.changeReason || null,
        createdById: data.actorId || null,
        updatedById: data.actorId || null,
        version: 1,
      },
    });

    return {
      override: created as unknown as ConfigurationOverride,
      previousValue: null,
    };
  }

  async deleteOverride(
    key: string,
    scopeType: ConfigurationScopeType,
    scopeId?: string | null,
  ): Promise<ConfigurationOverride | null> {
    const existing = await this.findOverride(key, scopeType, scopeId);
    if (!existing) return null;

    await this.prisma.configurationOverride.delete({
      where: { id: existing.id },
    });

    return existing;
  }
}
