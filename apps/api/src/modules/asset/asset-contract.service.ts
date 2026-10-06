import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetContractRepository } from './asset-contract.repository.js';
import { EventsService } from '../events/events.service.js';
import { createEvent, DOMAIN_EVENTS } from '@community-os/events';
import type { Actor, AssetServiceContract, ServiceContractType } from '@community-os/types';

export interface CreateAssetServiceContractInput {
  organizationId: string;
  communityId: string;
  contractNumber: string;
  name: string;
  serviceProviderName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  startDate: string;
  endDate: string;
  contractType?: ServiceContractType;
  coverageSummary: string;
  preventiveVisitsPerYear?: number;
  includesParts?: boolean;
  includesLabor?: boolean;
  slaResponseHours?: number | null;
  termsDocumentId?: string | null;
  coveredAssetIds?: string[];
}

@Injectable()
export class AssetContractService {
  constructor(
    private readonly repository: AssetContractRepository,
    private readonly eventsService: EventsService,
  ) {}

  async createContract(
    input: CreateAssetServiceContractInput,
    actor: Actor,
  ): Promise<AssetServiceContract> {
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

    const contract = await this.repository.create(
      {
        contractNumber: input.contractNumber,
        name: input.name,
        serviceProviderName: input.serviceProviderName,
        contactPhone: input.contactPhone ?? null,
        contactEmail: input.contactEmail ?? null,
        startDate,
        endDate,
        contractType: input.contractType ?? 'AMC',
        status,
        coverageSummary: input.coverageSummary,
        preventiveVisitsPerYear: input.preventiveVisitsPerYear ?? 4,
        includesParts: input.includesParts ?? false,
        includesLabor: input.includesLabor ?? true,
        slaResponseHours: input.slaResponseHours ?? null,
        termsDocumentId: input.termsDocumentId ?? null,
        organization: { connect: { id: input.organizationId } },
        community: { connect: { id: input.communityId } },
        ...(actor.id ? { createdByUser: { connect: { id: actor.id } } } : {}),
      },
      input.coveredAssetIds,
    );

    return contract;
  }

  async getContractById(id: string): Promise<AssetServiceContract> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new NotFoundException(`Contract '${id}' not found`);
    }
    return contract;
  }

  async listContracts(filters: {
    organizationId?: string;
    communityId?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'TERMINATED';
    contractType?: ServiceContractType;
    search?: string;
  }): Promise<AssetServiceContract[]> {
    return this.repository.findMany(filters);
  }

  async linkAssetsToContract(
    contractId: string,
    assetIds: string[],
    notes: string | null,
    _actor: Actor,
  ): Promise<void> {
    const contract = await this.getContractById(contractId);
    await this.repository.linkAssets(contractId, assetIds, notes);

    for (const assetId of assetIds) {
      this.eventsService.publish(
        createEvent(DOMAIN_EVENTS.ASSET_CONTRACT_LINKED, {
          contractId,
          assetId,
          organizationId: contract.organizationId,
          communityId: contract.communityId,
        }),
      );
    }
  }

  async unlinkAssetFromContract(contractId: string, assetId: string, _actor: Actor): Promise<void> {
    await this.getContractById(contractId);
    await this.repository.unlinkAsset(contractId, assetId);
  }
}
