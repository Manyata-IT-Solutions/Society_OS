import { Injectable, NotFoundException } from '@nestjs/common';
import { StockAdjustmentRepository } from './stock-adjustment.repository.js';
import { InventorySequenceService } from './inventory-sequence.service.js';
import { StockLedgerService } from './stock-ledger.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, StockAdjustment } from '@community-os/types';

@Injectable()
export class StockAdjustmentService {
  constructor(
    private readonly adjustmentRepo: StockAdjustmentRepository,
    private readonly sequenceService: InventorySequenceService,
    private readonly stockLedgerService: StockLedgerService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createAdjustment(
    data: {
      organizationId: string;
      communityId?: string | null;
      storeId: string;
      reason?: any;
      notes?: string | null;
      documentId?: string | null;
      lines: Array<{
        itemId: string;
        binId?: string | null;
        batchId?: string | null;
        serialId?: string | null;
        quantityDelta: number;
        uomId: string;
        reasonDetails?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<StockAdjustment> {
    return this.prisma.$transaction(async (tx) => {
      const adjustmentNumber = await this.sequenceService.getNextNumber(
        data.organizationId,
        data.communityId ?? null,
        'ADJUSTMENT',
        'ADJ',
      );

      const adjustment = await tx.stockAdjustment.create({
        data: {
          organization: { connect: { id: data.organizationId } },
          ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
          adjustmentNumber,
          store: { connect: { id: data.storeId } },
          reason: data.reason ?? 'COUNT_CORRECTION',
          status: 'POSTED',
          postedAt: new Date(),
          postedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
          notes: data.notes ?? null,
          documentId: data.documentId ?? null,
          lines: {
            create: data.lines.map((l) => ({
              item: { connect: { id: l.itemId } },
              ...(l.binId ? { bin: { connect: { id: l.binId } } } : {}),
              ...(l.batchId ? { batch: { connect: { id: l.batchId } } } : {}),
              ...(l.serialId ? { serial: { connect: { id: l.serialId } } } : {}),
              quantityDelta: l.quantityDelta,
              uom: { connect: { id: l.uomId } },
              reasonDetails: l.reasonDetails ?? null,
            })),
          },
        },
        include: {
          store: true,
          lines: {
            include: {
              item: { include: { baseUom: true } },
              uom: true,
              bin: true,
              batch: true,
              serial: true,
            },
          },
          requestedByUser: true,
          postedByUser: true,
        },
      });

      for (const line of adjustment.lines) {
        const delta = Number(line.quantityDelta);
        const transType = delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';

        await this.stockLedgerService.recordMovement(
          {
            organizationId: data.organizationId,
            communityId: data.communityId,
            storeId: data.storeId,
            binId: line.binId,
            itemId: line.itemId,
            batchId: line.batchId,
            serialId: line.serialId,
            transactionType: transType,
            quantityDelta: delta,
            uom: line.uom.code,
            referenceType: 'ADJUSTMENT',
            referenceId: adjustment.id,
            notes: `Stock Adjustment ${adjustment.adjustmentNumber} (${adjustment.reason})`,
            onHandDelta: delta,
            reservedDelta: 0,
          },
          actor,
          tx,
        );
      }

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_STOCK_ADJUSTED,
          {
            adjustmentId: adjustment.id,
            adjustmentNumber: adjustment.adjustmentNumber,
            storeId: adjustment.storeId,
            reason: adjustment.reason,
          },
          {
            organizationId: data.organizationId,
            communityId: data.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return adjustment as any;
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }) {
    return this.adjustmentRepo.findAll(params);
  }

  async findById(id: string): Promise<StockAdjustment> {
    const adjustment = await this.adjustmentRepo.findById(id);
    if (!adjustment) {
      throw new NotFoundException(`Stock adjustment '${id}' not found`);
    }
    return adjustment as any;
  }
}
