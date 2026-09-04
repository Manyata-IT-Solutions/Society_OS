import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { StockTransferRepository } from './stock-transfer.repository.js';
import { InventorySequenceService } from './inventory-sequence.service.js';
import { StockLedgerService } from './stock-ledger.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, StockTransfer } from '@community-os/types';

@Injectable()
export class StockTransferService {
  constructor(
    private readonly transferRepo: StockTransferRepository,
    private readonly sequenceService: InventorySequenceService,
    private readonly stockLedgerService: StockLedgerService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createTransfer(
    data: {
      organizationId: string;
      communityId?: string | null;
      sourceStoreId: string;
      destinationStoreId: string;
      notes?: string | null;
      lines: Array<{
        itemId: string;
        requestedQty: number;
        dispatchedQty: number;
        uomId: string;
        batchId?: string | null;
        serialIds?: string[];
        sourceBinId?: string | null;
        destinationBinId?: string | null;
        notes?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<StockTransfer> {
    if (data.sourceStoreId === data.destinationStoreId) {
      throw new BadRequestException('Source and destination store cannot be the same');
    }

    return this.prisma.$transaction(async (tx) => {
      const transferNumber = await this.sequenceService.getNextNumber(
        data.organizationId,
        data.communityId ?? null,
        'TRANSFER',
        'TRF',
      );

      const transfer = await tx.stockTransfer.create({
        data: {
          organization: { connect: { id: data.organizationId } },
          ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
          transferNumber,
          sourceStore: { connect: { id: data.sourceStoreId } },
          destinationStore: { connect: { id: data.destinationStoreId } },
          status: 'DISPATCHED',
          dispatchedAt: new Date(),
          dispatchedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
          notes: data.notes ?? null,
          lines: {
            create: data.lines.map((l) => ({
              item: { connect: { id: l.itemId } },
              requestedQty: l.requestedQty,
              dispatchedQty: l.dispatchedQty,
              receivedQty: 0,
              uom: { connect: { id: l.uomId } },
              ...(l.batchId ? { batch: { connect: { id: l.batchId } } } : {}),
              serialIds: l.serialIds ?? [],
              ...(l.sourceBinId ? { sourceBin: { connect: { id: l.sourceBinId } } } : {}),
              ...(l.destinationBinId
                ? { destinationBin: { connect: { id: l.destinationBinId } } }
                : {}),
              notes: l.notes ?? null,
            })),
          },
        },
        include: {
          sourceStore: true,
          destinationStore: true,
          lines: {
            include: {
              item: { include: { baseUom: true } },
              uom: true,
              sourceBin: true,
              destinationBin: true,
              batch: true,
            },
          },
          dispatchedByUser: true,
          receivedByUser: true,
        },
      });

      // Deduct from source store
      for (const line of transfer.lines) {
        await this.stockLedgerService.recordMovement(
          {
            organizationId: data.organizationId,
            communityId: data.communityId,
            storeId: data.sourceStoreId,
            binId: line.sourceBinId,
            itemId: line.itemId,
            batchId: line.batchId,
            transactionType: 'TRANSFER_OUT',
            quantityDelta: -Number(line.dispatchedQty),
            uom: line.uom.code,
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
            notes: `Transfer Dispatch ${transfer.transferNumber} to ${transfer.destinationStore.name}`,
            onHandDelta: -Number(line.dispatchedQty),
            reservedDelta: 0,
          },
          actor,
          tx,
        );
      }

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_STOCK_TRANSFERRED,
          {
            transferId: transfer.id,
            transferNumber: transfer.transferNumber,
            sourceStoreId: transfer.sourceStoreId,
            destinationStoreId: transfer.destinationStoreId,
            status: 'DISPATCHED',
          },
          {
            organizationId: data.organizationId,
            communityId: data.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return transfer as any;
    });
  }

  async receiveTransfer(id: string, actor: Actor): Promise<StockTransfer> {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer || transfer.status !== 'DISPATCHED') {
      throw new BadRequestException(`Transfer '${id}' is not in DISPATCHED state`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Add stock to destination store
      for (const line of transfer.lines as any[]) {
        const receivedQty = Number(line.dispatchedQty); // Full receipt
        await tx.stockTransferLine.update({
          where: { id: line.id },
          data: { receivedQty },
        });

        await this.stockLedgerService.recordMovement(
          {
            organizationId: transfer.organizationId,
            communityId: transfer.communityId,
            storeId: transfer.destinationStoreId,
            binId: line.destinationBinId,
            itemId: line.itemId,
            batchId: line.batchId,
            transactionType: 'TRANSFER_IN',
            quantityDelta: receivedQty,
            uom: line.uom.code,
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
            notes: `Transfer Receipt ${transfer.transferNumber} from ${transfer.sourceStore?.name || transfer.sourceStoreId}`,
            onHandDelta: receivedQty,
            reservedDelta: 0,
          },
          actor,
          tx,
        );

        // Update serial locations if serialized
        if (line.serialIds && line.serialIds.length > 0) {
          for (const sId of line.serialIds as string[]) {
            await tx.inventorySerial.update({
              where: { id: sId },
              data: {
                currentStoreId: transfer.destinationStoreId,
                currentBinId: line.destinationBinId ?? null,
              },
            });
          }
        }
      }

      const updated = await tx.stockTransfer.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
          receivedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
        },
        include: {
          sourceStore: true,
          destinationStore: true,
          lines: {
            include: {
              item: { include: { baseUom: true } },
              uom: true,
              sourceBin: true,
              destinationBin: true,
              batch: true,
            },
          },
          dispatchedByUser: true,
          receivedByUser: true,
        },
      });

      return updated as any;
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    sourceStoreId?: string;
    destinationStoreId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }) {
    return this.transferRepo.findAll(params);
  }

  async findById(id: string): Promise<StockTransfer> {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) {
      throw new NotFoundException(`Stock transfer '${id}' not found`);
    }
    return transfer as any;
  }
}
