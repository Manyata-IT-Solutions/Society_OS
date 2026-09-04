import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetModelRepository } from './asset-model.repository.js';
import { AssetCategoryRepository } from './asset-category.repository.js';
import type { Actor, AssetModel } from '@community-os/types';

export interface CreateAssetModelInput {
  organizationId: string;
  communityId?: string | null;
  categoryId: string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  description?: string | null;
  expectedLifeYears?: number | null;
  specifications?: Record<string, unknown>;
}

export interface UpdateAssetModelInput {
  categoryId?: string;
  manufacturer?: string;
  modelName?: string;
  modelNumber?: string;
  description?: string | null;
  expectedLifeYears?: number | null;
  specifications?: Record<string, unknown>;
  status?: 'ACTIVE' | 'ARCHIVED';
}

@Injectable()
export class AssetModelService {
  constructor(
    private readonly repository: AssetModelRepository,
    private readonly categoryRepo: AssetCategoryRepository,
  ) {}

  async createModel(input: CreateAssetModelInput, actor: Actor): Promise<AssetModel> {
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw new NotFoundException(`Asset category '${input.categoryId}' not found`);
    }

    return this.repository.create({
      manufacturer: input.manufacturer,
      modelName: input.modelName,
      modelNumber: input.modelNumber,
      description: input.description ?? null,
      expectedLifeYears: input.expectedLifeYears ?? null,
      specifications: (input.specifications ?? {}) as any,
      organization: { connect: { id: input.organizationId } },
      ...(input.communityId ? { community: { connect: { id: input.communityId } } } : {}),
      category: { connect: { id: input.categoryId } },
      ...(actor.id ? { createdByUser: { connect: { id: actor.id } } } : {}),
    }) as any;
  }

  async getModelById(id: string): Promise<AssetModel> {
    const model = await this.repository.findById(id);
    if (!model) {
      throw new NotFoundException(`Asset model '${id}' not found`);
    }
    return model as any;
  }

  async listModels(filters: {
    organizationId: string;
    communityId?: string | null;
    categoryId?: string;
    manufacturer?: string;
    status?: 'ACTIVE' | 'ARCHIVED';
    search?: string;
  }): Promise<AssetModel[]> {
    return this.repository.findMany(filters) as any;
  }

  async updateModel(id: string, input: UpdateAssetModelInput, _actor: Actor): Promise<AssetModel> {
    const existing = await this.getModelById(id);

    if (input.categoryId && input.categoryId !== existing.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) {
        throw new NotFoundException(`Asset category '${input.categoryId}' not found`);
      }
    }

    return this.repository.update(id, {
      manufacturer: input.manufacturer ?? existing.manufacturer,
      modelName: input.modelName ?? existing.modelName,
      modelNumber: input.modelNumber ?? existing.modelNumber,
      description: input.description !== undefined ? input.description : existing.description,
      expectedLifeYears:
        input.expectedLifeYears !== undefined
          ? input.expectedLifeYears
          : existing.expectedLifeYears,
      specifications:
        input.specifications !== undefined
          ? (input.specifications as any)
          : (existing.specifications as any),
      status: input.status ?? existing.status,
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
    }) as any;
  }
}
