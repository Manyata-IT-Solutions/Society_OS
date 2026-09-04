import { Injectable, HttpStatus } from '@nestjs/common';
import { FacilityCategoryRepository, CategoryWithTeam } from './facility-category.repository.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { Actor, WorkOrderPriority, EntityStatus } from '@community-os/types';

export interface CreateFacilityCategoryInput {
  organizationId: string;
  communityId?: string | null;
  key: string;
  name: string;
  description?: string | null;
  status?: EntityStatus;
  defaultTeamId?: string | null;
  defaultPriority?: WorkOrderPriority;
  defaultSlaPolicyId?: string | null;
}

export interface UpdateFacilityCategoryInput {
  name?: string;
  description?: string | null;
  status?: EntityStatus;
  defaultTeamId?: string | null;
  defaultPriority?: WorkOrderPriority;
  defaultSlaPolicyId?: string | null;
}

@Injectable()
export class FacilityCategoryService {
  constructor(private readonly categoryRepo: FacilityCategoryRepository) {}

  async createCategory(
    input: CreateFacilityCategoryInput,
    actor?: Actor,
  ): Promise<CategoryWithTeam> {
    const existing = await this.categoryRepo.findByKey(
      input.organizationId,
      input.communityId ?? null,
      input.key,
    );
    if (existing) {
      throw new DomainException(
        'CATEGORY_KEY_EXISTS',
        `Facility work category with key "${input.key}" already exists.`,
        HttpStatus.CONFLICT,
      );
    }

    return this.categoryRepo.create({
      ...input,
      createdById: actor?.id ?? null,
    });
  }

  async getCategoryById(id: string): Promise<CategoryWithTeam> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new DomainException(
        'CATEGORY_NOT_FOUND',
        `Facility work category "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return category;
  }

  async listCategories(filters: {
    organizationId?: string;
    communityId?: string | null;
    status?: EntityStatus;
  }): Promise<CategoryWithTeam[]> {
    return this.categoryRepo.findMany(filters);
  }

  async updateCategory(
    id: string,
    input: UpdateFacilityCategoryInput,
    _actor?: Actor,
  ): Promise<CategoryWithTeam> {
    await this.getCategoryById(id);
    return this.categoryRepo.update(id, input);
  }
}
