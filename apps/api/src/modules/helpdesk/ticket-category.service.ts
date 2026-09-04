import { Injectable, HttpStatus } from '@nestjs/common';
import { TicketCategoryRepository } from './ticket-category.repository.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  CreateTicketCategoryInput,
  UpdateTicketCategoryInput,
} from '@community-os/validation';
import type { TicketCategory, Actor } from '@community-os/types';

@Injectable()
export class TicketCategoryService {
  constructor(private readonly categoryRepo: TicketCategoryRepository) {}

  async createCategory(input: CreateTicketCategoryInput, actor?: Actor): Promise<TicketCategory> {
    // 1. Check duplicate key within same org & community scope
    const existing = await this.categoryRepo.findByKey(
      input.organizationId,
      input.communityId ?? null,
      input.key,
    );
    if (existing) {
      throw new DomainException(
        'CATEGORY_KEY_ALREADY_EXISTS',
        `Ticket category with key "${input.key}" already exists in this scope.`,
        HttpStatus.CONFLICT,
      );
    }

    // 2. Validate parent category if specified
    if (input.parentId) {
      const parent = await this.categoryRepo.findById(input.parentId);
      if (!parent) {
        throw new DomainException(
          'PARENT_CATEGORY_NOT_FOUND',
          `Parent category with id "${input.parentId}" was not found.`,
          HttpStatus.NOT_FOUND,
        );
      }
      if (parent.parentId) {
        throw new DomainException(
          'MAX_CATEGORY_DEPTH_EXCEEDED',
          'Categories only support 2-tier hierarchy (Category -> Subcategory).',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.categoryRepo.create({
      organizationId: input.organizationId,
      communityId: input.communityId ?? null,
      parentId: input.parentId ?? null,
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      defaultPriority: input.defaultPriority,
      defaultSlaPolicyId: input.defaultSlaPolicyId ?? null,
      defaultTeamId: input.defaultTeamId ?? null,
      workflowDefinitionId: input.workflowDefinitionId ?? null,
      residentVisible: input.residentVisible,
      isSensitive: input.isSensitive,
      allowAttachments: input.allowAttachments,
      displayOrder: input.displayOrder,
      createdById: actor?.id ?? null,
    });
  }

  async updateCategory(
    id: string,
    input: UpdateTicketCategoryInput,
    _actor?: Actor,
  ): Promise<TicketCategory> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      throw new DomainException(
        'CATEGORY_NOT_FOUND',
        `Ticket category with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (input.parentId !== undefined && input.parentId !== null) {
      if (input.parentId === id) {
        throw new DomainException(
          'INVALID_PARENT_CATEGORY',
          'A category cannot be its own parent.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const parent = await this.categoryRepo.findById(input.parentId);
      if (!parent) {
        throw new DomainException(
          'PARENT_CATEGORY_NOT_FOUND',
          `Parent category with id "${input.parentId}" was not found.`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    return this.categoryRepo.update(id, {
      ...input,
    });
  }

  async getCategoryById(
    id: string,
  ): Promise<TicketCategory & { subcategories?: TicketCategory[] }> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new DomainException(
        'CATEGORY_NOT_FOUND',
        `Ticket category with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return category;
  }

  async listCategories(filters: {
    organizationId?: string;
    communityId?: string | null;
    residentVisible?: boolean;
    status?: 'ACTIVE' | 'ARCHIVED';
    parentId?: string | null;
  }): Promise<TicketCategory[]> {
    return this.categoryRepo.findMany(filters);
  }

  async getCategoryTree(
    organizationId: string,
    communityId?: string | null,
    residentVisible?: boolean,
  ): Promise<Array<TicketCategory & { subcategories: TicketCategory[] }>> {
    return this.categoryRepo.findTree(organizationId, communityId, residentVisible);
  }

  async archiveCategory(id: string): Promise<TicketCategory> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      throw new DomainException(
        'CATEGORY_NOT_FOUND',
        `Ticket category with id "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.categoryRepo.archive(id);
  }
}
