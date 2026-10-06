import { Injectable, NotFoundException } from '@nestjs/common';
import { InventorySerialRepository } from './inventory-serial.repository.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import type { Actor, InventorySerial } from '@community-os/types';

@Injectable()
export class InventorySerialService {
  constructor(
    private readonly serialRepo: InventorySerialRepository,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createSerial(
    data: {
      itemId: string;
      serialNumber: string;
      currentStoreId?: string | null;
      currentBinId?: string | null;
      batchId?: string | null;
    },
    actor: Actor,
  ): Promise<InventorySerial> {
    return this.serialRepo.create({
      item: { connect: { id: data.itemId } },
      serialNumber: data.serialNumber,
      status: 'IN_STOCK',
      ...(data.currentStoreId ? { currentStore: { connect: { id: data.currentStoreId } } } : {}),
      ...(data.currentBinId ? { currentBin: { connect: { id: data.currentBinId } } } : {}),
      ...(data.batchId ? { batch: { connect: { id: data.batchId } } } : {}),
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
    } as any) as any;
  }

  async convertToAsset(
    data: {
      serialId: string;
      assetCategoryId: string;
      assetModelId?: string | null;
      name: string;
      locationDescription?: string | null;
      notes?: string | null;
    },
    actor: Actor,
  ): Promise<{ serial: InventorySerial; assetId: string }> {
    const serial = await this.serialRepo.findById(data.serialId);
    if (!serial) {
      throw new NotFoundException(`Serial '${data.serialId}' not found`);
    }
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: serial.itemId },
      });

      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }

      let communityId = item.communityId;
      if (!communityId) {
        const comm = await tx.community.findFirst({
          where: { organizationId: item.organizationId },
        });
        if (comm) communityId = comm.id;
      }

      let categoryId = data.assetCategoryId;
      if (!categoryId) {
        const cat = await tx.assetCategory.findFirst({
          where: { organizationId: item.organizationId },
        });
        if (cat) categoryId = cat.id;
      }

      const qrIdentifier = `ast_qr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Create asset from serial record
      const asset = await tx.asset.create({
        data: {
          organization: { connect: { id: item.organizationId } },
          community: { connect: { id: communityId! } },
          assetCode: `AST-${serial.serialNumber}`,
          name: (data as any).name || (data as any).assetName || item.name,
          category: { connect: { id: categoryId! } },
          ...(data.assetModelId ? { model: { connect: { id: data.assetModelId } } } : {}),
          serialNumber: serial.serialNumber,
          locationDescription: data.locationDescription ?? null,
          operationalStatus: 'OPERATIONAL',
          lifecycleState: 'INSTALLED',
          qrIdentifier,
          description: data.notes ?? `Converted from inventory serial ${serial.serialNumber}`,
          createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
        } as any,
      });

      const updatedSerial = await tx.inventorySerial.update({
        where: { id: data.serialId },
        data: {
          status: 'CONVERTED_TO_ASSET',
          assetId: asset.id,
        },
        include: {
          item: true,
          currentStore: true,
          currentBin: true,
          currentWorkOrder: true,
          batch: true,
        },
      });

      return {
        serial: updatedSerial as any,
        assetId: asset.id,
      };
    });
  }

  async findAll(params: {
    itemId?: string;
    currentStoreId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }) {
    return this.serialRepo.findAll(params);
  }

  async findById(id: string): Promise<InventorySerial> {
    const serial = await this.serialRepo.findById(id);
    if (!serial) {
      throw new NotFoundException(`Serial '${id}' not found`);
    }
    return serial as any;
  }
}
