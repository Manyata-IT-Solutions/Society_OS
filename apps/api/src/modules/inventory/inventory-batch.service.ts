import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryBatchRepository } from './inventory-batch.repository.js';
import type { Actor, InventoryBatch } from '@community-os/types';

@Injectable()
export class InventoryBatchService {
  constructor(private readonly batchRepo: InventoryBatchRepository) {}

  async createBatch(
    data: {
      itemId: string;
      batchNumber: string;
      manufacturedAt?: Date | string | null;
      expiryAt?: Date | string | null;
      supplierName?: string | null;
      notes?: string | null;
    },
    actor: Actor,
  ): Promise<InventoryBatch> {
    return this.batchRepo.create({
      item: { connect: { id: data.itemId } },
      batchNumber: data.batchNumber,
      manufacturedAt: data.manufacturedAt ? new Date(data.manufacturedAt) : null,
      expiryAt: data.expiryAt ? new Date(data.expiryAt) : null,
      supplierName: data.supplierName ?? null,
      notes: data.notes ?? null,
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
    } as any) as any;
  }

  async findAll(params: { itemId?: string; status?: any; skip?: number; take?: number }) {
    return this.batchRepo.findAll(params);
  }

  async findById(id: string): Promise<InventoryBatch> {
    const batch = await this.batchRepo.findById(id);
    if (!batch) {
      throw new NotFoundException(`Batch '${id}' not found`);
    }
    return batch as any;
  }
}
