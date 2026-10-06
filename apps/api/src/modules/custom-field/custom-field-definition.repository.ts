import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  CustomFieldDefinition,
  CustomFieldEntityType,
  CustomFieldStatus,
  CustomFieldType,
  CustomFieldVisibility,
} from '@community-os/types';
import type { Prisma } from '@prisma/client';

export interface CreateFieldDefinitionData {
  organizationId: string;
  communityId?: string | null;
  entityType: CustomFieldEntityType;
  key: string;
  label: string;
  description?: string | null;
  fieldType: CustomFieldType;
  required?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  validationRules?: Record<string, unknown> | null;
  options?: unknown[] | null;
  defaultValue?: unknown;
  displayOrder?: number;
  visibility?: CustomFieldVisibility;
  actorId?: string | null;
}

export interface UpdateFieldDefinitionData {
  label?: string;
  description?: string | null;
  required?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  status?: CustomFieldStatus;
  validationRules?: Record<string, unknown> | null;
  options?: unknown[] | null;
  defaultValue?: unknown;
  displayOrder?: number;
  visibility?: CustomFieldVisibility;
  expectedVersion?: number;
}

@Injectable()
export class CustomFieldDefinitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDefinitionById(id: string): Promise<CustomFieldDefinition | null> {
    const def = await this.prisma.customFieldDefinition.findUnique({
      where: { id },
    });
    return (def as unknown as CustomFieldDefinition) || null;
  }

  async findDefinitionByKey(
    organizationId: string,
    communityId: string | null,
    entityType: CustomFieldEntityType,
    key: string,
  ): Promise<CustomFieldDefinition | null> {
    const def = await this.prisma.customFieldDefinition.findFirst({
      where: {
        organizationId,
        communityId: communityId || null,
        entityType,
        key,
      },
    });
    return (def as unknown as CustomFieldDefinition) || null;
  }

  async findManyDefinitions(params: {
    organizationId?: string;
    communityId?: string | null;
    entityType?: CustomFieldEntityType;
    status?: CustomFieldStatus;
  }): Promise<CustomFieldDefinition[]> {
    const where: Prisma.CustomFieldDefinitionWhereInput = {};

    if (params.organizationId) where.organizationId = params.organizationId;
    if (params.communityId !== undefined) where.communityId = params.communityId;
    if (params.entityType) where.entityType = params.entityType;
    if (params.status) where.status = params.status;

    const items = await this.prisma.customFieldDefinition.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { label: 'asc' }],
    });

    return items as unknown as CustomFieldDefinition[];
  }

  async findActiveDefinitionsForEntity(
    organizationId: string,
    communityId: string | null,
    entityType: CustomFieldEntityType,
  ): Promise<CustomFieldDefinition[]> {
    // Hierarchical match: Definitions for this community OR definitions for the organization without communityId
    const items = await this.prisma.customFieldDefinition.findMany({
      where: {
        organizationId,
        entityType,
        status: 'ACTIVE',
        OR: [{ communityId: null }, ...(communityId ? [{ communityId }] : [])],
      },
      orderBy: [{ displayOrder: 'asc' }, { label: 'asc' }],
    });

    return items as unknown as CustomFieldDefinition[];
  }

  async createDefinition(data: CreateFieldDefinitionData): Promise<CustomFieldDefinition> {
    const created = await this.prisma.customFieldDefinition.create({
      data: {
        organizationId: data.organizationId,
        communityId: data.communityId || null,
        entityType: data.entityType,
        key: data.key,
        label: data.label,
        description: data.description || null,
        fieldType: data.fieldType,
        required: data.required ?? false,
        searchable: data.searchable ?? false,
        filterable: data.filterable ?? false,
        status: 'ACTIVE',
        validationRules: (data.validationRules as Prisma.InputJsonValue) || undefined,
        options: (data.options as Prisma.InputJsonValue) || undefined,
        defaultValue: (data.defaultValue as Prisma.InputJsonValue) || undefined,
        displayOrder: data.displayOrder ?? 0,
        visibility: data.visibility ?? 'TENANT_INTERNAL',
        createdById: data.actorId || null,
        version: 1,
      },
    });

    return created as unknown as CustomFieldDefinition;
  }

  async updateDefinition(
    id: string,
    data: UpdateFieldDefinitionData,
  ): Promise<CustomFieldDefinition> {
    const updated = await this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.required !== undefined && { required: data.required }),
        ...(data.searchable !== undefined && { searchable: data.searchable }),
        ...(data.filterable !== undefined && { filterable: data.filterable }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.validationRules !== undefined && {
          validationRules: data.validationRules as Prisma.InputJsonValue,
        }),
        ...(data.options !== undefined && {
          options: data.options as Prisma.InputJsonValue,
        }),
        ...(data.defaultValue !== undefined && {
          defaultValue: data.defaultValue as Prisma.InputJsonValue,
        }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        version: { increment: 1 },
      },
    });

    return updated as unknown as CustomFieldDefinition;
  }
}
