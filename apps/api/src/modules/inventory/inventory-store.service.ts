import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryStoreRepository } from './inventory-store.repository.js';
import type { Actor, InventoryStore, StockBin } from '@community-os/types';

@Injectable()
export class InventoryStoreService {
  constructor(private readonly storeRepo: InventoryStoreRepository) {}

  async createStore(
    data: {
      organizationId: string;
      communityId?: string | null;
      code: string;
      name: string;
      description?: string | null;
      storeType?: any;
      propertySectionId?: string | null;
      buildingId?: string | null;
      locationDescription?: string | null;
      managerUserId?: string | null;
    },
    actor: Actor,
  ): Promise<InventoryStore> {
    const existing = await this.storeRepo.findStoreByCode(
      data.organizationId,
      data.communityId ?? null,
      data.code.toUpperCase(),
    );
    if (existing) {
      throw new ConflictException(`Inventory store '${data.code}' already exists`);
    }

    return this.storeRepo.createStore({
      organization: { connect: { id: data.organizationId } },
      ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description ?? null,
      storeType: data.storeType ?? 'MAINTENANCE',
      locationDescription: data.locationDescription ?? null,
      ...(data.propertySectionId
        ? { propertySection: { connect: { id: data.propertySectionId } } }
        : {}),
      ...(data.buildingId ? { building: { connect: { id: data.buildingId } } } : {}),
      ...(data.managerUserId ? { managerUser: { connect: { id: data.managerUserId } } } : {}),
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
    } as any) as any;
  }

  async findAllStores(organizationId: string, communityId?: string): Promise<InventoryStore[]> {
    return this.storeRepo.findAllStores(organizationId, communityId) as any;
  }

  async findStoreById(id: string): Promise<InventoryStore> {
    const store = await this.storeRepo.findStoreById(id);
    if (!store) {
      throw new NotFoundException(`Inventory store '${id}' not found`);
    }
    return store as any;
  }

  async createBin(
    data: {
      storeId: string;
      code: string;
      name: string;
      rack?: string | null;
      shelf?: string | null;
      bin?: string | null;
    },
    _actor: Actor,
  ): Promise<StockBin> {
    await this.findStoreById(data.storeId);
    return this.storeRepo.createBin({
      store: { connect: { id: data.storeId } },
      code: data.code.toUpperCase(),
      name: data.name,
      rack: data.rack ?? null,
      shelf: data.shelf ?? null,
      bin: data.bin ?? null,
    } as any) as any;
  }

  async findAllBins(storeId: string): Promise<StockBin[]> {
    return this.storeRepo.findAllBins(storeId) as any;
  }
}
