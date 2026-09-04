import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AssetRepository } from './asset.repository.js';
import { AssetCategoryRepository } from './asset-category.repository.js';
import { AssetModelRepository } from './asset-model.repository.js';
import { AssetSequenceService } from './asset-sequence.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { createEvent, DOMAIN_EVENTS } from '@community-os/events';
import type {
  Actor,
  Asset,
  AssetCondition,
  AssetCriticality,
  AssetKpiMetrics,
  AssetLifecycleState,
  AssetOperationalStatus,
  WorkOrderLocationType,
} from '@community-os/types';

export interface CreateAssetInput {
  organizationId: string;
  communityId: string;
  assetCode?: string;
  name: string;
  description?: string | null;
  assetCategoryId: string;
  assetModelId?: string | null;
  criticality?: AssetCriticality;
  locationType?: WorkOrderLocationType;
  propertySectionId?: string | null;
  buildingId?: string | null;
  floorId?: string | null;
  unitId?: string | null;
  locationDescription?: string | null;
  parentAssetId?: string | null;
  isMovable?: boolean;
  serialNumber?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  purchaseDate?: string | null;
  installationDate?: string | null;
  expectedLifeYears?: number | null;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  warrantyProviderName?: string | null;
  barcodeIdentifier?: string | null;
  primaryPhotoDocumentId?: string | null;
  customFields?: Record<string, unknown>;
}

export interface UpdateAssetInput {
  name?: string;
  description?: string | null;
  assetCategoryId?: string;
  assetModelId?: string | null;
  criticality?: AssetCriticality;
  locationDescription?: string | null;
  parentAssetId?: string | null;
  isMovable?: boolean;
  serialNumber?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  purchaseDate?: string | null;
  installationDate?: string | null;
  expectedLifeYears?: number | null;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  warrantyProviderName?: string | null;
  barcodeIdentifier?: string | null;
  primaryPhotoDocumentId?: string | null;
  customFields?: Record<string, unknown>;
}

export interface MoveAssetLocationInput {
  toLocationType: WorkOrderLocationType;
  toSectionId?: string | null;
  toBuildingId?: string | null;
  toFloorId?: string | null;
  toUnitId?: string | null;
  toLocationDescription?: string | null;
  reason: string;
}

export interface CommissionAssetInput {
  commissionedAt?: string;
  notes?: string | null;
  initialCondition?: AssetCondition;
  documentId?: string | null;
}

export interface DecommissionAssetInput {
  reason: string;
  replacementAssetId?: string | null;
  decommissionedAt?: string;
  documentId?: string | null;
  cancelActiveWorkOrders?: boolean;
}

export interface DisposeAssetInput {
  reason: string;
  disposalMethod: string;
  disposedAt?: string;
}

export interface ReportBreakdownInput {
  reason?: 'BREAKDOWN' | 'EMERGENCY_REPAIR' | 'SCHEDULED_MAINTENANCE' | 'POWER_OUTAGE' | 'OTHER';
  impactLevel?: 'FULL_OUTAGE' | 'PARTIAL_DEGRADATION' | 'NO_IMPACT';
  notes: string;
  createWorkOrder?: boolean;
  workOrderTitle?: string;
  workOrderPriority?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
}

@Injectable()
export class AssetService {
  constructor(
    private readonly repository: AssetRepository,
    private readonly categoryRepo: AssetCategoryRepository,
    private readonly modelRepo: AssetModelRepository,
    private readonly sequenceService: AssetSequenceService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createAsset(input: CreateAssetInput, actor: Actor): Promise<Asset> {
    const category = await this.categoryRepo.findById(input.assetCategoryId);
    if (!category) {
      throw new NotFoundException(`Asset category '${input.assetCategoryId}' not found`);
    }

    if (input.assetModelId) {
      const model = await this.modelRepo.findById(input.assetModelId);
      if (!model) {
        throw new NotFoundException(`Asset model '${input.assetModelId}' not found`);
      }
    }

    if (input.parentAssetId) {
      const parent = await this.repository.findById(input.parentAssetId);
      if (!parent) {
        throw new NotFoundException(`Parent asset '${input.parentAssetId}' not found`);
      }
      if (parent.communityId !== input.communityId) {
        throw new BadRequestException('Parent asset must belong to the same community');
      }
    }

    // Generate human-readable asset code if not provided
    const assetCode =
      input.assetCode ||
      (await this.sequenceService.nextAssetCode(
        input.organizationId,
        input.communityId,
        category.code ? `AST-${category.code.toUpperCase()}` : 'AST',
      ));

    // Generate secure opaque QR token (non-PII, cryptographically random)
    const qrIdentifier = `ast_qr_${crypto.randomBytes(16).toString('hex')}`;

    const asset = await this.repository.create({
      assetCode,
      name: input.name,
      description: input.description ?? null,
      criticality: input.criticality ?? category.defaultCriticality ?? 'MEDIUM',
      locationType: input.locationType ?? 'COMMUNITY',
      locationDescription: input.locationDescription ?? null,
      isMovable: input.isMovable ?? false,
      serialNumber: input.serialNumber ?? null,
      manufacturer: input.manufacturer ?? null,
      modelNumber: input.modelNumber ?? null,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      installationDate: input.installationDate ? new Date(input.installationDate) : null,
      expectedLifeYears: input.expectedLifeYears ?? category.defaultExpectedLifeYears ?? null,
      warrantyStartDate: input.warrantyStartDate ? new Date(input.warrantyStartDate) : null,
      warrantyEndDate: input.warrantyEndDate ? new Date(input.warrantyEndDate) : null,
      warrantyProviderName: input.warrantyProviderName ?? null,
      barcodeIdentifier: input.barcodeIdentifier ?? null,
      qrIdentifier,
      primaryPhotoDocumentId: input.primaryPhotoDocumentId ?? null,
      organization: { connect: { id: input.organizationId } },
      community: { connect: { id: input.communityId } },
      category: { connect: { id: input.assetCategoryId } },
      ...(input.assetModelId ? { model: { connect: { id: input.assetModelId } } } : {}),
      ...(input.propertySectionId
        ? { propertySection: { connect: { id: input.propertySectionId } } }
        : {}),
      ...(input.buildingId ? { building: { connect: { id: input.buildingId } } } : {}),
      ...(input.floorId ? { floor: { connect: { id: input.floorId } } } : {}),
      ...(input.unitId ? { unit: { connect: { id: input.unitId } } } : {}),
      ...(input.parentAssetId ? { parentAsset: { connect: { id: input.parentAssetId } } } : {}),
      ...(actor.id ? { createdByUser: { connect: { id: actor.id } } } : {}),
    });

    await this.auditService.record({
      organizationId: asset.organizationId,
      communityId: asset.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id,
      sessionId: actor?.sessionId,
      action: 'ASSET_CREATED',
      resourceType: 'ASSET',
      resourceId: asset.id,
      metadata: { assetCode, name: asset.name, categoryId: asset.assetCategoryId },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_CREATED, {
        assetId: asset.id,
        assetCode: asset.assetCode,
        name: asset.name,
        organizationId: asset.organizationId,
        communityId: asset.communityId,
        categoryId: asset.assetCategoryId,
        criticality: asset.criticality,
        locationType: asset.locationType,
      }),
    );

    return asset;
  }

  async getAssetById(id: string): Promise<Asset> {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw new NotFoundException(`Asset '${id}' not found`);
    }
    return asset;
  }

  async getAssetByIdentifier(identifier: string): Promise<Asset> {
    const asset = await this.repository.findByIdentifier(identifier);
    if (!asset) {
      throw new NotFoundException(`Asset not found for identifier '${identifier}'`);
    }
    return asset;
  }

  async listAssets(filters: {
    organizationId?: string;
    communityId?: string;
    categoryId?: string;
    modelId?: string;
    lifecycleState?: AssetLifecycleState | AssetLifecycleState[];
    operationalStatus?: AssetOperationalStatus | AssetOperationalStatus[];
    condition?: AssetCondition | AssetCondition[];
    criticality?: AssetCriticality | AssetCriticality[];
    buildingId?: string;
    floorId?: string;
    unitId?: string;
    parentAssetId?: string;
    isMovable?: boolean;
    manufacturer?: string;
    search?: string;
    warrantyExpiringDays?: number;
    contractExpiringDays?: number;
    maintenanceDueBefore?: string;
    page?: number;
    limit?: number;
    sortBy?:
      | 'assetCode'
      | 'name'
      | 'createdAt'
      | 'installationDate'
      | 'criticality'
      | 'warrantyEndDate'
      | 'nextMaintenanceDueAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: Asset[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.repository.findMany({
      ...filters,
      lifecycleState: Array.isArray(filters.lifecycleState)
        ? { in: filters.lifecycleState }
        : filters.lifecycleState,
      operationalStatus: Array.isArray(filters.operationalStatus)
        ? { in: filters.operationalStatus }
        : filters.operationalStatus,
      condition: Array.isArray(filters.condition) ? { in: filters.condition } : filters.condition,
      criticality: Array.isArray(filters.criticality)
        ? { in: filters.criticality }
        : filters.criticality,
      maintenanceDueBefore: filters.maintenanceDueBefore
        ? new Date(filters.maintenanceDueBefore)
        : undefined,
    });
  }

  async updateAsset(id: string, input: UpdateAssetInput, _actor: Actor): Promise<Asset> {
    const existing = await this.getAssetById(id);

    if (input.parentAssetId && input.parentAssetId === id) {
      throw new BadRequestException('Asset cannot be its own parent');
    }

    const updated = await this.repository.update(id, {
      name: input.name ?? existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      criticality: input.criticality ?? existing.criticality,
      locationDescription:
        input.locationDescription !== undefined
          ? input.locationDescription
          : existing.locationDescription,
      isMovable: input.isMovable ?? existing.isMovable,
      serialNumber: input.serialNumber !== undefined ? input.serialNumber : existing.serialNumber,
      manufacturer: input.manufacturer !== undefined ? input.manufacturer : existing.manufacturer,
      modelNumber: input.modelNumber !== undefined ? input.modelNumber : existing.modelNumber,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : existing.purchaseDate,
      installationDate: input.installationDate
        ? new Date(input.installationDate)
        : existing.installationDate,
      expectedLifeYears:
        input.expectedLifeYears !== undefined
          ? input.expectedLifeYears
          : existing.expectedLifeYears,
      warrantyStartDate: input.warrantyStartDate
        ? new Date(input.warrantyStartDate)
        : existing.warrantyStartDate,
      warrantyEndDate: input.warrantyEndDate
        ? new Date(input.warrantyEndDate)
        : existing.warrantyEndDate,
      warrantyProviderName:
        input.warrantyProviderName !== undefined
          ? input.warrantyProviderName
          : existing.warrantyProviderName,
      barcodeIdentifier:
        input.barcodeIdentifier !== undefined
          ? input.barcodeIdentifier
          : existing.barcodeIdentifier,
      primaryPhotoDocumentId:
        input.primaryPhotoDocumentId !== undefined
          ? input.primaryPhotoDocumentId
          : existing.primaryPhotoDocumentId,
      ...(input.assetCategoryId ? { category: { connect: { id: input.assetCategoryId } } } : {}),
      ...(input.assetModelId !== undefined
        ? input.assetModelId
          ? { model: { connect: { id: input.assetModelId } } }
          : { model: { disconnect: true } }
        : {}),
      ...(input.parentAssetId !== undefined
        ? input.parentAssetId
          ? { parentAsset: { connect: { id: input.parentAssetId } } }
          : { parentAsset: { disconnect: true } }
        : {}),
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_UPDATED, {
        assetId: updated.id,
        assetCode: updated.assetCode,
        name: updated.name,
        organizationId: updated.organizationId,
        communityId: updated.communityId,
      }),
    );

    return updated;
  }

  async moveAssetLocation(id: string, input: MoveAssetLocationInput, actor: Actor): Promise<Asset> {
    const existing = await this.getAssetById(id);

    const updated = await this.repository.recordLocationMove(
      id,
      {
        fromLocationType: existing.locationType,
        fromSectionId: existing.propertySectionId,
        fromBuildingId: existing.buildingId,
        fromFloorId: existing.floorId,
        fromUnitId: existing.unitId,
        fromLocationDescription: existing.locationDescription,
        toLocationType: input.toLocationType,
        toSectionId: input.toSectionId ?? null,
        toBuildingId: input.toBuildingId ?? null,
        toFloorId: input.toFloorId ?? null,
        toUnitId: input.toUnitId ?? null,
        toLocationDescription: input.toLocationDescription ?? null,
        movedByUser: actor.id ? { connect: { id: actor.id } } : undefined,
        reason: input.reason,
      },
      {
        locationType: input.toLocationType,
        locationDescription: input.toLocationDescription ?? null,
        ...(input.toSectionId
          ? { propertySection: { connect: { id: input.toSectionId } } }
          : { propertySection: { disconnect: true } }),
        ...(input.toBuildingId
          ? { building: { connect: { id: input.toBuildingId } } }
          : { building: { disconnect: true } }),
        ...(input.toFloorId
          ? { floor: { connect: { id: input.toFloorId } } }
          : { floor: { disconnect: true } }),
        ...(input.toUnitId
          ? { unit: { connect: { id: input.toUnitId } } }
          : { unit: { disconnect: true } }),
      },
    );

    await this.auditService.record({
      organizationId: existing.organizationId,
      communityId: existing.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id,
      sessionId: actor?.sessionId,
      action: 'ASSET_LOCATION_CHANGED',
      resourceType: 'ASSET',
      resourceId: id,
      metadata: {
        fromLocation: existing.locationType,
        toLocation: input.toLocationType,
        reason: input.reason,
      },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_LOCATION_CHANGED, {
        assetId: id,
        assetCode: existing.assetCode,
        organizationId: existing.organizationId,
        communityId: existing.communityId,
        fromLocationType: existing.locationType,
        toLocationType: input.toLocationType,
        toBuildingId: input.toBuildingId,
        toUnitId: input.toUnitId,
        movedById: actor.id,
        reason: input.reason,
      }),
    );

    return updated;
  }

  async commissionAsset(id: string, input: CommissionAssetInput, actor: Actor): Promise<Asset> {
    const existing = await this.getAssetById(id);

    const commissionedAt = input.commissionedAt ? new Date(input.commissionedAt) : new Date();

    const updated = await this.repository.update(id, {
      lifecycleState: 'ACTIVE',
      operationalStatus: 'OPERATIONAL',
      condition: input.initialCondition ?? 'GOOD',
      commissionedAt,
      commissioningNotes: input.notes ?? null,
      commissionedByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    // Record commissioning service record
    await this.repository.recordServiceRecord({
      asset: { connect: { id } },
      serviceDate: commissionedAt,
      serviceType: 'COMMISSIONING',
      summary: input.notes || 'Asset commissioned into operational service',
      technicianNotes: input.notes ?? null,
      documentId: input.documentId ?? null,
      source: 'MANUAL_ENTRY',
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    await this.auditService.record({
      organizationId: existing.organizationId,
      communityId: existing.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id,
      sessionId: actor?.sessionId,
      action: 'ASSET_COMMISSIONED',
      resourceType: 'ASSET',
      resourceId: id,
      metadata: { lifecycleState: 'ACTIVE', condition: input.initialCondition ?? 'GOOD' },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_COMMISSIONED, {
        assetId: id,
        assetCode: existing.assetCode,
        organizationId: existing.organizationId,
        communityId: existing.communityId,
        commissionedAt: commissionedAt.toISOString(),
        commissionedById: actor.id,
      }),
    );

    return updated;
  }

  async decommissionAsset(id: string, input: DecommissionAssetInput, actor: Actor): Promise<Asset> {
    const existing = await this.getAssetById(id);

    const activeWorkCount = await this.repository.countActiveWorkOrders(id);
    if (activeWorkCount > 0 && !input.cancelActiveWorkOrders) {
      throw new BadRequestException(
        `Cannot decommission asset with ${activeWorkCount} active work order(s). Set cancelActiveWorkOrders=true to proceed.`,
      );
    }

    const decommissionedAt = input.decommissionedAt ? new Date(input.decommissionedAt) : new Date();

    const updated = await this.repository.update(id, {
      lifecycleState: 'DECOMMISSIONED',
      operationalStatus: 'OUT_OF_SERVICE',
      status: 'ARCHIVED',
      decommissionedAt,
      decommissionReason: input.reason,
      decommissionedByUser: actor.id ? { connect: { id: actor.id } } : undefined,
      replacementAsset: input.replacementAssetId
        ? { connect: { id: input.replacementAssetId } }
        : undefined,
    });

    await this.auditService.record({
      organizationId: existing.organizationId,
      communityId: existing.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id,
      sessionId: actor?.sessionId,
      action: 'ASSET_DECOMMISSIONED',
      resourceType: 'ASSET',
      resourceId: id,
      metadata: { lifecycleState: 'DECOMMISSIONED', reason: input.reason },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_DECOMMISSIONED, {
        assetId: id,
        assetCode: existing.assetCode,
        organizationId: existing.organizationId,
        communityId: existing.communityId,
        reason: input.reason,
        replacementAssetId: input.replacementAssetId,
        decommissionedById: actor.id,
      }),
    );

    return updated;
  }

  async disposeAsset(id: string, input: DisposeAssetInput, actor: Actor): Promise<Asset> {
    const existing = await this.getAssetById(id);

    const disposedAt = input.disposedAt ? new Date(input.disposedAt) : new Date();

    const updated = await this.repository.update(id, {
      lifecycleState: 'DISPOSED',
      status: 'ARCHIVED',
      disposedAt,
      disposalReason: input.reason,
      disposalMethod: input.disposalMethod,
      disposedByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    await this.auditService.record({
      organizationId: existing.organizationId,
      communityId: existing.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id,
      sessionId: actor?.sessionId,
      action: 'ASSET_DISPOSED',
      resourceType: 'ASSET',
      resourceId: id,
      metadata: { lifecycleState: 'DISPOSED', method: input.disposalMethod, reason: input.reason },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_DISPOSED, {
        assetId: id,
        assetCode: existing.assetCode,
        organizationId: existing.organizationId,
        communityId: existing.communityId,
      }),
    );

    return updated;
  }

  async updateCondition(
    id: string,
    condition: AssetCondition,
    operationalStatus?: AssetOperationalStatus,
    actor?: Actor,
  ): Promise<Asset> {
    const existing = await this.getAssetById(id);

    const updated = await this.repository.update(id, {
      condition,
      ...(operationalStatus ? { operationalStatus } : {}),
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_CONDITION_CHANGED, {
        assetId: id,
        assetCode: existing.assetCode,
        organizationId: existing.organizationId,
        communityId: existing.communityId,
        fromCondition: existing.condition,
        toCondition: condition,
        operationalStatus: operationalStatus ?? existing.operationalStatus,
        updatedById: actor?.id ?? 'SYSTEM',
      }),
    );

    return updated;
  }

  async reportBreakdown(id: string, input: ReportBreakdownInput, actor: Actor): Promise<Asset> {
    const existing = await this.getAssetById(id);

    // 1. Mark asset OUT_OF_SERVICE
    const updated = await this.repository.update(id, {
      operationalStatus: 'OUT_OF_SERVICE',
      condition: existing.condition === 'CRITICAL' ? 'CRITICAL' : 'POOR',
    });

    // 2. Open downtime record
    const downtime = await this.repository.recordDowntime({
      asset: { connect: { id } },
      startedAt: new Date(),
      reason: input.reason ?? 'BREAKDOWN',
      impactLevel: input.impactLevel ?? 'FULL_OUTAGE',
      notes: input.notes,
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });

    await this.auditService.record({
      organizationId: existing.organizationId,
      communityId: existing.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id,
      sessionId: actor?.sessionId,
      action: 'ASSET_BREAKDOWN_REPORTED',
      resourceType: 'ASSET',
      resourceId: id,
      metadata: { downtimeId: downtime.id, notes: input.notes },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_BREAKDOWN_REPORTED, {
        assetId: id,
        assetCode: existing.assetCode,
        organizationId: existing.organizationId,
        communityId: existing.communityId,
        downtimeId: downtime.id,
        reason: input.reason ?? 'BREAKDOWN',
        impactLevel: input.impactLevel ?? 'FULL_OUTAGE',
        reportedById: actor.id,
      }),
    );

    return updated;
  }

  async restoreAsset(id: string, notes: string | null, actor: Actor): Promise<Asset> {
    const existing = await this.getAssetById(id);

    // Close open downtime
    const openDowntime = await this.repository.findOpenDowntime(id);
    if (openDowntime) {
      const endedAt = new Date();
      const durationMinutes = Math.max(
        1,
        Math.round((endedAt.getTime() - openDowntime.startedAt.getTime()) / 60000),
      );
      await this.repository.closeDowntime(
        openDowntime.id,
        endedAt,
        durationMinutes,
        actor.id,
        notes,
      );

      this.eventsService.publish(
        createEvent(DOMAIN_EVENTS.ASSET_RESTORED, {
          assetId: id,
          assetCode: existing.assetCode,
          organizationId: existing.organizationId,
          communityId: existing.communityId,
          downtimeId: openDowntime.id,
          durationMinutes,
          restoredById: actor.id,
        }),
      );
    }

    const updated = await this.repository.update(id, {
      operationalStatus: 'OPERATIONAL',
      condition: 'GOOD',
    });

    return updated;
  }

  async regenerateQr(id: string, actor: Actor): Promise<Asset> {
    const existing = await this.getAssetById(id);
    const newQr = `ast_qr_${crypto.randomBytes(16).toString('hex')}`;

    const updated = await this.repository.update(id, {
      qrIdentifier: newQr,
    });

    await this.auditService.record({
      organizationId: existing.organizationId,
      communityId: existing.communityId,
      actorType: actor?.isPlatformAdmin ? 'SYSTEM' : 'USER',
      actorId: actor?.id,
      sessionId: actor?.sessionId,
      action: 'ASSET_QR_REGENERATED',
      resourceType: 'ASSET',
      resourceId: id,
      metadata: { oldQr: existing.qrIdentifier, newQr },
    });

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_QR_REGENERATED, {
        assetId: id,
        assetCode: existing.assetCode,
        organizationId: existing.organizationId,
        communityId: existing.communityId,
      }),
    );

    return updated;
  }

  async getServiceHistory(id: string): Promise<{
    workOrders: unknown[];
    serviceRecords: unknown[];
    downtimes: unknown[];
    locationHistories: unknown[];
  }> {
    await this.getAssetById(id);
    return this.repository.getServiceHistory(id);
  }

  async getLocationHistory(id: string): Promise<any[]> {
    await this.getAssetById(id);
    return this.repository.getLocationHistory(id);
  }

  async getKpiMetrics(
    organizationId: string,
    communityId?: string | null,
  ): Promise<AssetKpiMetrics> {
    return this.repository.getKpiMetrics(organizationId, communityId);
  }
}
