import { Injectable, NotFoundException } from '@nestjs/common';
import { StockCountRepository } from './stock-count.repository.js';
import { InventorySequenceService } from './inventory-sequence.service.js';
import { StockLedgerService } from './stock-ledger.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, StockCount } from '@community-os/types';

@Injectable()
export class StockCountService {
  constructor(
    private readonly countRepo: StockCountRepository,
    private readonly sequenceService: InventorySequenceService,
    private readonly stockLedgerService: StockLedgerService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createStockCount(
    data: {
      organizationId: string;
      communityId?: string | null;
      storeId: string;
      countType?: any;
      freezeMovements?: boolean;
      notes?: string | null;
      itemIds?: string[];
    },
    _actor: Actor,
  ): Promise<StockCount> {
    return this.prisma.$transaction(async (tx) => {
      const countNumber = await this.sequenceService.getNextNumber(
        data.organizationId,
        data.communityId ?? null,
        'COUNT',
        'CNT',
      );

      // Snapshot active stock balances for this store
      const balances = await tx.stockBalance.findMany({
        where: {
          storeId: data.storeId,
          ...(data.itemIds && data.itemIds.length > 0 ? { itemId: { in: data.itemIds } } : {}),
        },
        include: { item: true },
      });

      const lines = balances.map((b) => ({
        itemId: b.itemId,
        binId: b.binId,
        batchId: b.batchId,
        systemSnapshotQty: Number(b.quantityOnHand),
        countedQty: null,
        varianceQty: null,
        uomId: b.item.baseUomId,
      }));

      const count = await tx.stockCount.create({
        data: {
          organization: { connect: { id: data.organizationId } },
          ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
          countNumber,
          store: { connect: { id: data.storeId } },
          countType: data.countType ?? 'FULL',
          status: 'IN_PROGRESS',
          freezeMovements: data.freezeMovements ?? false,
          startedAt: new Date(),
          notes: data.notes ?? null,
          lines: {
            create: lines.map((l) => ({
              item: { connect: { id: l.itemId } },
              ...(l.binId ? { bin: { connect: { id: l.binId } } } : {}),
              ...(l.batchId ? { batch: { connect: { id: l.batchId } } } : {}),
              systemSnapshotQty: l.systemSnapshotQty,
              uom: { connect: { id: l.uomId } },
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
              countedByUser: true,
            },
          },
          submittedByUser: true,
          reviewedByUser: true,
          postedByUser: true,
        },
      });

      return count as any;
    });
  }

  async recordLines(
    countId: string,
    lines: Array<{
      itemId: string;
      binId?: string | null;
      batchId?: string | null;
      countedQty: number;
      uomId: string;
      notes?: string | null;
    }>,
    actor: Actor,
  ): Promise<StockCount> {
    const count = await this.countRepo.findById(countId);
    if (!count) {
      throw new NotFoundException(`Stock count '${countId}' not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      for (const lineInput of lines) {
        const existingLine = ((count.lines || []) as any[]).find((l) =>
          (lineInput as any).lineId
            ? l.id === (lineInput as any).lineId
            : l.itemId === lineInput.itemId && (l.binId || null) === (lineInput.binId || null),
        );

        if (existingLine) {
          const snapshot = Number(existingLine.systemSnapshotQty);
          const variance = lineInput.countedQty - snapshot;
          await tx.stockCountLine.update({
            where: { id: existingLine.id },
            data: {
              countedQty: lineInput.countedQty,
              varianceQty: variance,
              notes: lineInput.notes ?? null,
              countedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
              countedAt: new Date(),
            },
          });
        } else {
          await tx.stockCountLine.create({
            data: {
              countDocument: { connect: { id: countId } },
              item: { connect: { id: lineInput.itemId } },
              ...(lineInput.binId ? { bin: { connect: { id: lineInput.binId } } } : {}),
              ...(lineInput.batchId ? { batch: { connect: { id: lineInput.batchId } } } : {}),
              systemSnapshotQty: 0,
              countedQty: lineInput.countedQty,
              varianceQty: lineInput.countedQty,
              uom: { connect: { id: lineInput.uomId } },
              notes: lineInput.notes ?? null,
              countedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
              countedAt: new Date(),
            },
          });
        }
      }

      const updated = await tx.stockCount.update({
        where: { id: countId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          submittedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
        },
        include: {
          store: true,
          lines: {
            include: {
              item: { include: { baseUom: true } },
              uom: true,
              bin: true,
              batch: true,
              countedByUser: true,
            },
          },
          submittedByUser: true,
          reviewedByUser: true,
          postedByUser: true,
        },
      });

      return updated as any;
    });
  }

  async postReconciliation(countId: string, actor: Actor): Promise<StockCount> {
    const count = await this.countRepo.findById(countId);
    if (!count) {
      throw new NotFoundException(`Stock count '${countId}' not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      let reconciledCount = 0;
      for (const line of (count.lines || []) as any[]) {
        const variance = Number(line.varianceQty || 0);
        if (variance !== 0) {
          reconciledCount++;
          await this.stockLedgerService.recordMovement(
            {
              organizationId: count.organizationId,
              communityId: count.communityId,
              storeId: count.storeId,
              binId: line.binId,
              itemId: line.itemId,
              batchId: line.batchId,
              transactionType: 'COUNT_RECONCILIATION',
              quantityDelta: variance,
              uom: line.uom?.code || line.item?.baseUom?.code || 'PCS',
              referenceType: 'STOCK_COUNT',
              referenceId: count.id,
              notes: `Cycle Count Reconciliation ${count.countNumber}: variance ${variance}`,
              onHandDelta: variance,
              reservedDelta: 0,
            },
            actor,
            tx,
          );
        }
      }

      const updated = await tx.stockCount.update({
        where: { id: countId },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
        },
        include: {
          store: true,
          lines: {
            include: {
              item: { include: { baseUom: true } },
              uom: true,
              bin: true,
              batch: true,
              countedByUser: true,
            },
          },
          submittedByUser: true,
          reviewedByUser: true,
          postedByUser: true,
        },
      });

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_STOCK_COUNT_POSTED,
          {
            countId: count.id,
            countNumber: count.countNumber,
            storeId: count.storeId,
            totalLines: (count.lines || []).length,
            reconciledLines: reconciledCount,
          },
          {
            organizationId: count.organizationId,
            communityId: count.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return updated as any;
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
    return this.countRepo.findAll(params);
  }

  async findById(id: string): Promise<StockCount> {
    const count = await this.countRepo.findById(id);
    if (!count) {
      throw new NotFoundException(`Stock count '${id}' not found`);
    }
    return count as any;
  }
}
