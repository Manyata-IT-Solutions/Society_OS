import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryItemRepository } from './inventory-item.repository.js';
import { InventorySequenceService } from './inventory-sequence.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, InventoryItem, ItemStorePolicy } from '@community-os/types';
import crypto from 'crypto';

@Injectable()
export class InventoryItemService {
  constructor(
    private readonly itemRepo: InventoryItemRepository,
    private readonly sequenceService: InventorySequenceService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createItem(data: any, actor: Actor) {
    return this.create(data, actor);
  }
  async updateItem(id: string, data: any, _actor: Actor) {
    return this.itemRepo.update(id, data);
  }
  async upsertStorePolicy(itemId: string, storeId: string, data: any, actor: Actor) {
    return this.updateStorePolicy(itemId, storeId, data, actor);
  }
  async create(
    data: {
      organizationId: string;
      communityId?: string | null;
      itemCode?: string;
      name: string;
      description?: string | null;
      categoryId: string;
      itemType?: any;
      baseUomId: string;
      defaultIssueUomId?: string | null;
      stockTrackingType?: any;
      isBatchTracked?: boolean;
      isSerialTracked?: boolean;
      isExpiryTracked?: boolean;
      minStockLevel?: number | null;
      reorderLevel?: number | null;
      maxStockLevel?: number | null;
      preferredStoreId?: string | null;
      preferredBinId?: string | null;
      barcodeIdentifier?: string | null;
      qrIdentifier?: string | null;
      customFields?: Record<string, any>;
      initialStorePolicy?: {
        storeId: string;
        minQuantity?: number;
        reorderLevel?: number;
        reorderQuantity?: number;
        maxQuantity?: number | null;
        defaultBinId?: string | null;
      };
    },
    actor: Actor,
  ): Promise<InventoryItem> {
    const itemCode =
      data.itemCode ||
      (await this.sequenceService.getNextNumber(
        data.organizationId,
        data.communityId ?? null,
        'ITEM',
        'ITM',
      ));

    const existing = await this.itemRepo.findByCode(
      data.organizationId,
      data.communityId ?? null,
      itemCode,
    );
    if (existing) {
      throw new ConflictException(`Item with code '${itemCode}' already exists`);
    }

    const qrIdentifier = data.qrIdentifier || `itm_qr_${crypto.randomBytes(8).toString('hex')}`;
    const barcodeIdentifier =
      data.barcodeIdentifier || `BC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const item = await this.itemRepo.create({
      organization: { connect: { id: data.organizationId } },
      ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
      itemCode,
      name: data.name,
      description: data.description ?? null,
      category: { connect: { id: data.categoryId } },
      itemType: data.itemType ?? 'SPARE_PART',
      baseUom: { connect: { id: data.baseUomId } },
      ...(data.defaultIssueUomId
        ? { defaultIssueUom: { connect: { id: data.defaultIssueUomId } } }
        : {}),
      stockTrackingType: data.stockTrackingType ?? 'QUANTITY',
      isBatchTracked: data.isBatchTracked ?? false,
      isSerialTracked: data.isSerialTracked ?? false,
      isExpiryTracked: data.isExpiryTracked ?? false,
      minStockLevel: data.minStockLevel ?? null,
      reorderLevel: data.reorderLevel ?? null,
      maxStockLevel: data.maxStockLevel ?? null,
      ...(data.preferredStoreId
        ? { preferredStore: { connect: { id: data.preferredStoreId } } }
        : {}),
      ...(data.preferredBinId ? { preferredBin: { connect: { id: data.preferredBinId } } } : {}),
      barcodeIdentifier,
      qrIdentifier,
      customFields: data.customFields ?? {},
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
    } as any);

    if (data.initialStorePolicy) {
      await this.itemRepo.upsertStorePolicy(item.id, data.initialStorePolicy.storeId, {
        minQuantity: data.initialStorePolicy.minQuantity ?? 0,
        reorderLevel: data.initialStorePolicy.reorderLevel ?? 0,
        reorderQuantity: data.initialStorePolicy.reorderQuantity ?? 0,
        maxQuantity: data.initialStorePolicy.maxQuantity ?? null,
        defaultBinId: data.initialStorePolicy.defaultBinId ?? null,
        reorderEnabled: true,
      });
    }

    this.eventsService.publish(
      createEvent(
        DOMAIN_EVENTS.INVENTORY_ITEM_CREATED,
        {
          itemId: item.id,
          itemCode: item.itemCode,
          name: item.name,
          categoryId: item.categoryId,
          itemType: item.itemType,
          baseUomId: item.baseUomId,
        },
        {
          organizationId: data.organizationId,
          communityId: data.communityId ?? undefined,
          userId: actor?.id,
        },
      ),
    );

    return item as any;
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    categoryId?: string;
    itemType?: any;
    status?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return this.itemRepo.findAll(params);
  }

  async findById(id: string): Promise<InventoryItem> {
    const item = await this.itemRepo.findById(id);
    if (!item) {
      throw new NotFoundException(`Inventory item '${id}' not found`);
    }
    return item as any;
  }

  async findByIdentifier(code: string): Promise<InventoryItem> {
    const item = await this.itemRepo.findByIdentifier(code);
    if (!item) {
      throw new NotFoundException(`Inventory item with identifier '${code}' not found`);
    }
    return item as any;
  }

  async updateStorePolicy(
    itemId: string,
    storeId: string,
    data: {
      minQuantity: number;
      reorderLevel: number;
      reorderQuantity: number;
      maxQuantity?: number | null;
      defaultBinId?: string | null;
      reorderEnabled?: boolean;
    },
    _actor: Actor,
  ): Promise<ItemStorePolicy> {
    await this.findById(itemId);
    return this.itemRepo.upsertStorePolicy(itemId, storeId, data) as any;
  }
}
