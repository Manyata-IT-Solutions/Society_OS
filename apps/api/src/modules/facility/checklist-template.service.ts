import { Injectable, HttpStatus } from '@nestjs/common';
import {
  ChecklistTemplateRepository,
  ChecklistTemplateWithRelations,
} from './checklist-template.repository.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  Actor,
  FacilityChecklistItem,
  FacilityChecklistTemplateStatus,
} from '@community-os/types';

export interface CreateChecklistTemplateInput {
  organizationId: string;
  communityId?: string | null;
  name: string;
  code: string;
  status?: FacilityChecklistTemplateStatus;
  categoryId?: string | null;
  items: FacilityChecklistItem[];
}

export interface UpdateChecklistTemplateInput {
  name?: string;
  status?: FacilityChecklistTemplateStatus;
  categoryId?: string | null;
  items?: FacilityChecklistItem[];
}

@Injectable()
export class ChecklistTemplateService {
  constructor(private readonly checklistRepo: ChecklistTemplateRepository) {}

  async createTemplate(
    input: CreateChecklistTemplateInput,
    actor?: Actor,
  ): Promise<ChecklistTemplateWithRelations> {
    const existing = await this.checklistRepo.findByCode(
      input.organizationId,
      input.communityId ?? null,
      input.code,
      1,
    );
    if (existing) {
      throw new DomainException(
        'CHECKLIST_TEMPLATE_EXISTS',
        `Checklist template with code "${input.code}" already exists.`,
        HttpStatus.CONFLICT,
      );
    }

    return this.checklistRepo.create({
      ...input,
      version: 1,
      createdById: actor?.id ?? null,
    });
  }

  async getTemplateById(id: string): Promise<ChecklistTemplateWithRelations> {
    const template = await this.checklistRepo.findById(id);
    if (!template) {
      throw new DomainException(
        'CHECKLIST_TEMPLATE_NOT_FOUND',
        `Checklist template "${id}" was not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return template;
  }

  async listTemplates(filters: {
    organizationId?: string;
    communityId?: string | null;
    status?: FacilityChecklistTemplateStatus;
    categoryId?: string;
  }): Promise<ChecklistTemplateWithRelations[]> {
    return this.checklistRepo.findMany(filters);
  }

  async updateTemplate(
    id: string,
    input: UpdateChecklistTemplateInput,
    _actor?: Actor,
  ): Promise<ChecklistTemplateWithRelations> {
    const existing = await this.getTemplateById(id);

    // If template is already published and items are modified, create a new version
    if (existing.status === 'PUBLISHED' && input.items) {
      const nextVersion = existing.version + 1;
      return this.checklistRepo.create({
        organizationId: existing.organizationId,
        communityId: existing.communityId,
        name: input.name ?? existing.name,
        code: existing.code,
        version: nextVersion,
        status: input.status ?? 'PUBLISHED',
        categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
        items: input.items,
        createdById: _actor?.id ?? null,
      });
    }

    return this.checklistRepo.update(id, input);
  }
}
