import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryReturnRepository } from './inventory-return.repository.js';
import { InventorySequenceService } from './inventory-sequence.service.js';
import { StockLedgerService } from './stock-ledger.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, InventoryReturn } from '@community-os/types';

@Injectable()
export class InventoryReturnService {
  constructor(
    private readonly returnRepo: InventoryReturnRepository,
    private readonly sequenceService: InventorySequenceService,
    private readonly stockLedgerService: StockLedgerService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createReturn(
    data: {
      organizationId: string;
      communityId?: string | null;
      storeId: string;
      returnType?: any;
      workOrderId?: string | null;
      issueId?: string | null;
      notes?: string | null;
      lines: Array<{
        issueLineId?: string | null;
        itemId: string;
        quantity: number;
        uomId: string;
        batchId?: string | null;
        serialId?: string | null;
        condition?: string;
        binId?: string | null;
        notes?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<InventoryReturn> {
    return this.prisma.$transaction(async (tx) => {
      const returnNumber = await this.sequenceService.getNextNumber(
        data.organizationId,
        data.communityId ?? null,
        'RETURN',
        'RET',
      );

      const ret = await tx.inventoryReturn.create({
        data: {
          organization: { connect: { id: data.organizationId } },
          ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
          returnNumber,
          store: { connect: { id: data.storeId } },
          returnType: data.returnType ?? 'WORK_ORDER_UNUSED',
          ...(data.workOrderId ? { workOrder: { connect: { id: data.workOrderId } } } : {}),
          ...(data.issueId ? { issue: { connect: { id: data.issueId } } } : {}),
          status: 'POSTED',
          returnedAt: new Date(),
          returnedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
          notes: data.notes ?? null,
          lines: {
            create: data.lines.map((l: any) => ({
              ...(l.issueLineId ? { issueLine: { connect: { id: l.issueLineId } } } : {}),
              item: { connect: { id: l.itemId } },
              quantity: l.quantity ?? l.returnedQty ?? 1,
              uom: { connect: { id: l.uomId } },
              ...(l.batchId ? { batch: { connect: { id: l.batchId } } } : {}),
              ...(l.serialId ? { serial: { connect: { id: l.serialId } } } : {}),
              condition: (l.condition as any) ?? 'GOOD',
              ...(l.binId ? { bin: { connect: { id: l.binId } } } : {}),
              notes: l.notes ?? null,
            })),
          },
        },
        include: {
          store: true,
          lines: {
            include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
          },
          returnedByUser: true,
          receivedByUser: true,
        },
      });

      for (const line of ret.lines) {
        await this.stockLedgerService.recordMovement(
          {
            organizationId: data.organizationId,
            communityId: data.communityId,
            storeId: data.storeId,
            binId: line.binId,
            itemId: line.itemId,
            batchId: line.batchId,
            serialId: line.serialId,
            transactionType: 'RETURN',
            quantityDelta: Number(line.quantity),
            uom: line.uom.code,
            referenceType: data.workOrderId ? 'WORK_ORDER' : 'ISSUE',
            referenceId: ret.id,
            notes: `Material Return ${ret.returnNumber}`,
            onHandDelta: Number(line.quantity),
            reservedDelta: 0,
          },
          actor,
          tx,
        );

        if (line.issueLineId) {
          await tx.inventoryIssueLine.update({
            where: { id: line.issueLineId },
            data: {
              returnedQty: { increment: Number(line.quantity) },
            },
          });
        }

        if (line.serialId) {
          await tx.inventorySerial.update({
            where: { id: line.serialId },
            data: {
              status: 'IN_STOCK',
              currentStoreId: data.storeId,
              currentBinId: line.binId ?? null,
              currentWorkOrderId: null,
            },
          });
        }
      }

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_STOCK_RETURNED,
          {
            returnId: ret.id,
            returnNumber: ret.returnNumber,
            storeId: ret.storeId,
            workOrderId: ret.workOrderId,
            lineCount: ret.lines.length,
          },
          {
            organizationId: data.organizationId,
            communityId: data.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return ret as any;
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    workOrderId?: string;
    skip?: number;
    take?: number;
  }) {
    return this.returnRepo.findAll(params);
  }

  async findById(id: string): Promise<InventoryReturn> {
    const ret = await this.returnRepo.findById(id);
    if (!ret) {
      throw new NotFoundException(`Inventory return '${id}' not found`);
    }
    return ret as any;
  }
}
