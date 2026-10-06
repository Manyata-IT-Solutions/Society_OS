import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { CustomFieldValue, CustomFieldEntityType } from '@community-os/types';
import type { Prisma } from '@prisma/client';

export interface SetFieldValueData {
  definitionId: string;
  organizationId: string;
  communityId?: string | null;
  entityType: CustomFieldEntityType;
  entityId: string;
  value: unknown;
  actorId?: string | null;
}

@Injectable()
export class CustomFieldValueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findValuesForEntity(
    entityType: CustomFieldEntityType,
    entityId: string,
  ): Promise<CustomFieldValue[]> {
    const items = await this.prisma.customFieldValue.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        definition: true,
      },
    });

    return items as unknown as CustomFieldValue[];
  }

  async countValuesByDefinitionId(definitionId: string): Promise<number> {
    return this.prisma.customFieldValue.count({
      where: { definitionId },
    });
  }

  async upsertValue(data: SetFieldValueData): Promise<CustomFieldValue> {
    const existing = await this.prisma.customFieldValue.findUnique({
      where: {
        definitionId_entityId: {
          definitionId: data.definitionId,
          entityId: data.entityId,
        },
      },
    });

    if (existing) {
      const updated = await this.prisma.customFieldValue.update({
        where: { id: existing.id },
        data: {
          value: data.value as Prisma.InputJsonValue,
          updatedById: data.actorId || null,
          version: { increment: 1 },
        },
        include: {
          definition: true,
        },
      });

      return updated as unknown as CustomFieldValue;
    }

    const created = await this.prisma.customFieldValue.create({
      data: {
        definitionId: data.definitionId,
        organizationId: data.organizationId,
        communityId: data.communityId || null,
        entityType: data.entityType,
        entityId: data.entityId,
        value: data.value as Prisma.InputJsonValue,
        createdById: data.actorId || null,
        updatedById: data.actorId || null,
        version: 1,
      },
      include: {
        definition: true,
      },
    });

    return created as unknown as CustomFieldValue;
  }
}
