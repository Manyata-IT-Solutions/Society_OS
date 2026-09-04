import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetWarrantyRepository } from './asset-warranty.repository.js';
import { AssetRepository } from './asset.repository.js';
import { EventsService } from '../events/events.service.js';
import { createEvent, DOMAIN_EVENTS } from '@community-os/events';
import type { Actor, AssetWarranty } from '@community-os/types';

export interface CreateAssetWarrantyInput {
  assetId: string;
  warrantyType?: string;
  providerName: string;
  referenceNumber?: string | null;
  startDate: string;
  endDate: string;
  coverageSummary: string;
  termsDocumentId?: string | null;
}

@Injectable()
export class AssetWarrantyService {
  constructor(
    private readonly repository: AssetWarrantyRepository,
    private readonly assetRepo: AssetRepository,
    private readonly eventsService: EventsService,
  ) {}

  async createWarranty(input: CreateAssetWarrantyInput, actor: Actor): Promise<AssetWarranty> {
    const asset = await this.assetRepo.findById(input.assetId);
    if (!asset) {
      throw new NotFoundException(`Asset '${input.assetId}' not found`);
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const now = new Date();
    let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';

    if (endDate < now) {
      status = 'EXPIRED';
    } else {
      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        status = 'EXPIRING_SOON';
      }
    }

    const warranty = await this.repository.create({
      warrantyType: input.warrantyType ?? 'STANDARD',
      providerName: input.providerName,
      referenceNumber: input.referenceNumber ?? null,
      startDate,
      endDate,
      coverageSummary: input.coverageSummary,
      termsDocumentId: input.termsDocumentId ?? null,
      status,
      asset: { connect: { id: input.assetId } },
      ...(actor.id ? { createdByUser: { connect: { id: actor.id } } } : {}),
    });

    // Update asset's primary warranty cache if this is latest
    if (!asset.warrantyEndDate || asset.warrantyEndDate < endDate) {
      await this.assetRepo.update(asset.id, {
        warrantyStartDate: startDate,
        warrantyEndDate: endDate,
        warrantyProviderName: input.providerName,
      });
    }

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_WARRANTY_ADDED, {
        warrantyId: warranty.id,
        assetId: asset.id,
        assetCode: asset.assetCode,
        organizationId: asset.organizationId,
        communityId: asset.communityId,
      }),
    );

    return warranty;
  }

  async listWarrantiesForAsset(assetId: string): Promise<AssetWarranty[]> {
    await this.assetRepo.findById(assetId);
    return this.repository.findByAssetId(assetId);
  }

  async getWarrantyById(id: string): Promise<AssetWarranty> {
    const warranty = await this.repository.findById(id);
    if (!warranty) {
      throw new NotFoundException(`Warranty '${id}' not found`);
    }
    return warranty;
  }
}
