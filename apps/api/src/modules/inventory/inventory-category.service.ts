import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryCategoryRepository } from './inventory-category.repository.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { Actor, InventoryCategory } from '@community-os/types';

@Injectable()
export class InventoryCategoryService {
  constructor(
    private readonly categoryRepo: InventoryCategoryRepository,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createCategory(data: any, actor: Actor) {
    return this.create(data, actor);
  }
  async create(
    data: {
      organizationId: string;
      communityId?: string | null;
      code: string;
      name: string;
      description?: string | null;
      parentId?: string | null;
      customFieldDefinitions?: any[];
    },
    actor: Actor,
  ): Promise<InventoryCategory> {
    const existing = await this.categoryRepo.findByCode(
      data.organizationId,
      data.communityId ?? null,
      data.code.toUpperCase(),
    );
    if (existing) {
      throw new ConflictException(`Inventory category '${data.code}' already exists`);
    }

    const category = await this.categoryRepo.create({
      organization: { connect: { id: data.organizationId } },
      ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description ?? null,
      customFieldDefinitions: data.customFieldDefinitions ?? [],
      ...(data.parentId ? { parent: { connect: { id: data.parentId } } } : {}),
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
    } as any);

    return category as any;
  }

  async findAll(organizationId: string, communityId?: string): Promise<InventoryCategory[]> {
    return this.categoryRepo.findAll(organizationId, communityId) as any;
  }

  async findById(id: string): Promise<InventoryCategory> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException(`Inventory category '${id}' not found`);
    }
    return category as any;
  }
}
