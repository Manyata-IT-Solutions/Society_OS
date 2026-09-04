import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AssetMeterRepository } from './asset-meter.repository.js';
import { AssetRepository } from './asset.repository.js';
import { EventsService } from '../events/events.service.js';
import { createEvent, DOMAIN_EVENTS } from '@community-os/events';
import type {
  Actor,
  AssetMeter,
  AssetMeterReading,
  AssetMeterType,
  AssetMeterReadingSource,
} from '@community-os/types';

export interface CreateAssetMeterInput {
  assetId: string;
  meterType?: AssetMeterType;
  name: string;
  unit: string;
  initialReading?: number;
  allowsReset?: boolean;
}

export interface AddAssetMeterReadingInput {
  reading: number;
  recordedAt?: string;
  source?: AssetMeterReadingSource;
  sourceWorkOrderId?: string | null;
  notes?: string | null;
  documentId?: string | null;
  isReset?: boolean;
}

@Injectable()
export class AssetMeterService {
  constructor(
    private readonly repository: AssetMeterRepository,
    private readonly assetRepo: AssetRepository,
    private readonly eventsService: EventsService,
  ) {}

  async createMeter(input: CreateAssetMeterInput, _actor: Actor): Promise<AssetMeter> {
    const asset = await this.assetRepo.findById(input.assetId);
    if (!asset) {
      throw new NotFoundException(`Asset '${input.assetId}' not found`);
    }

    return this.repository.createMeter({
      name: input.name,
      unit: input.unit,
      meterType: input.meterType ?? 'RUN_HOURS',
      currentReading: input.initialReading ?? 0,
      allowsReset: input.allowsReset ?? false,
      lastRecordedAt: new Date(),
      asset: { connect: { id: input.assetId } },
    }) as any;
  }

  async getMeterById(id: string): Promise<AssetMeter> {
    const meter = await this.repository.findMeterById(id);
    if (!meter) {
      throw new NotFoundException(`Asset meter '${id}' not found`);
    }
    return meter as any;
  }

  async listMetersForAsset(assetId: string): Promise<AssetMeter[]> {
    await this.assetRepo.findById(assetId);
    return this.repository.findMetersByAssetId(assetId) as any;
  }

  async recordReading(
    meterId: string,
    input: AddAssetMeterReadingInput,
    actor: Actor,
  ): Promise<AssetMeterReading> {
    const meter = await this.getMeterById(meterId);
    const asset = await this.assetRepo.findById(meter.assetId);
    if (!asset) throw new NotFoundException('Asset not found');

    const previousReading = Number(meter.currentReading);
    const newReading = input.reading;

    // Validate monotonic increase unless isReset=true
    if (!input.isReset && newReading < previousReading) {
      if (!meter.allowsReset) {
        throw new BadRequestException(
          `Reading '${newReading}' cannot be less than previous counter reading '${previousReading}'. Meter does not permit counter regression.`,
        );
      }
    }

    const delta = input.isReset ? 0 : Math.max(0, newReading - previousReading);
    const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();

    const reading = await this.repository.addReading(
      meterId,
      {
        reading: newReading,
        previousReading,
        delta,
        source: input.source ?? 'MANUAL',
        sourceWorkOrderId: input.sourceWorkOrderId ?? null,
        notes: input.notes ?? null,
        documentId: input.documentId ?? null,
        recordedAt,
        recordedByUser: actor.id ? { connect: { id: actor.id } } : undefined,
      },
      newReading,
      recordedAt,
    );

    this.eventsService.publish(
      createEvent(DOMAIN_EVENTS.ASSET_METER_READING_RECORDED, {
        readingId: reading.id,
        meterId,
        assetId: asset.id,
        assetCode: asset.assetCode,
        reading: newReading,
        delta,
        source: input.source ?? 'MANUAL',
        recordedById: actor.id,
      }),
    );

    return reading as any;
  }

  async getReadingHistory(meterId: string, limit = 50): Promise<AssetMeterReading[]> {
    await this.getMeterById(meterId);
    return this.repository.getReadingHistory(meterId, limit) as any;
  }
}
