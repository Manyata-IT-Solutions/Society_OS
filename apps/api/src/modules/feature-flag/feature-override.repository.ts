import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { FeatureOverride, FeatureScopeType } from '@community-os/types';
import type { Prisma } from '@prisma/client';

export interface SetFeatureOverrideData {
  featureKey: string;
  scopeType: FeatureScopeType;
  scopeId?: string | null;
  organizationId?: string | null;
  communityId?: string | null;
  enabled: boolean;
  reason?: string | null;
  actorId?: string | null;
}

@Injectable()
export class FeatureOverrideRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOverride(
    featureKey: string,
    scopeType: FeatureScopeType,
    scopeId?: string | null,
  ): Promise<FeatureOverride | null> {
    const override = await this.prisma.featureOverride.findFirst({
      where: {
        featureKey,
        scopeType,
        scopeId: scopeId || null,
      },
    });

    return (override as unknown as FeatureOverride) || null;
  }

  async findManyOverrides(params: {
    organizationId?: string;
    communityId?: string;
    scopeType?: FeatureScopeType;
  }): Promise<FeatureOverride[]> {
    const where: Prisma.FeatureOverrideWhereInput = {};

    if (params.scopeType) where.scopeType = params.scopeType;
    if (params.organizationId) where.organizationId = params.organizationId;
    if (params.communityId) where.communityId = params.communityId;

    const items = await this.prisma.featureOverride.findMany({
      where,
      orderBy: [{ featureKey: 'asc' }, { scopeType: 'asc' }],
    });

    return items as unknown as FeatureOverride[];
  }

  async upsertOverride(
    data: SetFeatureOverrideData,
  ): Promise<{ override: FeatureOverride; previousEnabled: boolean | null }> {
    const existing = await this.findOverride(data.featureKey, data.scopeType, data.scopeId);

    if (existing) {
      const updated = await this.prisma.featureOverride.update({
        where: { id: existing.id },
        data: {
          enabled: data.enabled,
          reason: data.reason || null,
          updatedById: data.actorId || null,
          version: { increment: 1 },
        },
      });

      return {
        override: updated as unknown as FeatureOverride,
        previousEnabled: existing.enabled,
      };
    }

    const created = await this.prisma.featureOverride.create({
      data: {
        featureKey: data.featureKey,
        scopeType: data.scopeType,
        scopeId: data.scopeId || null,
        organizationId: data.organizationId || null,
        communityId: data.communityId || null,
        enabled: data.enabled,
        reason: data.reason || null,
        createdById: data.actorId || null,
        updatedById: data.actorId || null,
        version: 1,
      },
    });

    return {
      override: created as unknown as FeatureOverride,
      previousEnabled: null,
    };
  }

  async deleteOverride(
    featureKey: string,
    scopeType: FeatureScopeType,
    scopeId?: string | null,
  ): Promise<FeatureOverride | null> {
    const existing = await this.findOverride(featureKey, scopeType, scopeId);
    if (!existing) return null;

    await this.prisma.featureOverride.delete({
      where: { id: existing.id },
    });

    return existing;
  }
}
