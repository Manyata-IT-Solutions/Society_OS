import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AssetCategoryRepository } from './asset-category.repository.js';
import type { Actor, AssetCategory } from '@community-os/types';

export interface CreateAssetCategoryInput {
  organizationId: string;
  communityId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  icon?: string | null;
  defaultCriticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultExpectedLifeYears?: number | null;
  customFieldDefinitions?: unknown[];
}

export interface UpdateAssetCategoryInput {
  name?: string;
  description?: string | null;
  parentId?: string | null;
  icon?: string | null;
  defaultCriticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultExpectedLifeYears?: number | null;
  customFieldDefinitions?: unknown[];
  status?: 'ACTIVE' | 'ARCHIVED';
}

@Injectable()
export class AssetCategoryService {
  constructor(private readonly repository: AssetCategoryRepository) {}

  async createCategory(input: CreateAssetCategoryInput, actor: Actor): Promise<AssetCategory> {
    const existing = await this.repository.findByCode(
      input.organizationId,
      input.communityId ?? null,
      input.code,
    );
    if (existing) {
      throw new ConflictException(`Asset category with code '${input.code}' already exists`);
    }

    if (input.parentId) {
      const parent = await this.repository.findById(input.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent category '${input.parentId}' not found`);
      }
    }

    return this.repository.create({
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      defaultCriticality: input.defaultCriticality ?? 'MEDIUM',
      defaultExpectedLifeYears: input.defaultExpectedLifeYears ?? null,
      customFieldDefinitions: (input.customFieldDefinitions ?? []) as any,
      organization: { connect: { id: input.organizationId } },
      ...(input.communityId ? { community: { connect: { id: input.communityId } } } : {}),
      ...(input.parentId ? { parentCategory: { connect: { id: input.parentId } } } : {}),
      ...(actor.id ? { createdByUser: { connect: { id: actor.id } } } : {}),
    }) as any;
  }

  async getCategoryById(id: string): Promise<AssetCategory> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Asset category '${id}' not found`);
    }
    return category as any;
  }

  async listCategories(filters: {
    organizationId: string;
    communityId?: string | null;
    status?: 'ACTIVE' | 'ARCHIVED';
    parentId?: string | null;
    search?: string;
  }): Promise<AssetCategory[]> {
    return this.repository.findMany(filters) as any;
  }

  async updateCategory(
    id: string,
    input: UpdateAssetCategoryInput,
    _actor: Actor,
  ): Promise<AssetCategory> {
    const existing = await this.getCategoryById(id);

    if (input.parentId && input.parentId === id) {
      throw new ConflictException('Category cannot be its own parent');
    }

    return (await this.repository.update(id, {
      name: input.name ?? existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      icon: input.icon !== undefined ? input.icon : existing.icon,
      defaultCriticality: input.defaultCriticality ?? existing.defaultCriticality,
      defaultExpectedLifeYears:
        input.defaultExpectedLifeYears !== undefined
          ? input.defaultExpectedLifeYears
          : existing.defaultExpectedLifeYears,
      customFieldDefinitions:
        input.customFieldDefinitions !== undefined
          ? (input.customFieldDefinitions as any)
          : (existing.customFieldDefinitions as any),
      status: input.status ?? existing.status,
      ...(input.parentId !== undefined
        ? input.parentId
          ? { parentCategory: { connect: { id: input.parentId } } }
          : { parentCategory: { disconnect: true } }
        : {}),
    })) as any;
  }
}
