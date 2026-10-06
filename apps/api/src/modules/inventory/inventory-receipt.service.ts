import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryReceiptRepository } from './inventory-receipt.repository.js';
import { InventorySequenceService } from './inventory-sequence.service.js';
import { StockLedgerService } from './stock-ledger.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, InventoryReceipt } from '@community-os/types';

@Injectable()
export class InventoryReceiptService {
  constructor(
    private readonly receiptRepo: InventoryReceiptRepository,
    private readonly sequenceService: InventorySequenceService,
    private readonly stockLedgerService: StockLedgerService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createReceipt(
    data: {
      organizationId: string;
      communityId?: string | null;
      storeId: string;
      sourceType?: any;
      sourceReference?: string | null;
      supplierName?: string | null;
      receivedAt?: Date | string;
      notes?: string | null;
      documentId?: string | null;
      lines: Array<{
        itemId: string;
        quantity: number;
        uomId: string;
        unitPrice?: number | null;
        batchNumber?: string | null;
        expiryDate?: Date | string | null;
        serialNumbers?: string[];
        binId?: string | null;
        notes?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<InventoryReceipt> {
    return this.prisma.$transaction(async (tx) => {
      const receiptNumber = await this.sequenceService.getNextNumber(
        data.organizationId,
        data.communityId ?? null,
        'RECEIPT',
        'RCP',
      );

      const preparedLines: any[] = [];
      for (const line of data.lines) {
        const batchNum = line.batchNumber || (line as any).batchNo || (line as any).batch;
        const serialList = line.serialNumbers || (line as any).serials || [];
        const qty = line.quantity ?? (line as any).receivedQty ?? 0;
        const unitCost = line.unitPrice ?? (line as any).unitCost ?? null;

        let batchId: string | null = null;
        if (batchNum) {
          const batch = await tx.inventoryBatch.upsert({
            where: {
              itemId_batchNumber: {
                itemId: line.itemId,
                batchNumber: batchNum,
              },
            },
            update: {
              expiryAt: line.expiryDate ? new Date(line.expiryDate) : undefined,
              supplierName: data.supplierName ?? undefined,
            },
            create: {
              itemId: line.itemId,
              batchNumber: batchNum,
              expiryAt: line.expiryDate ? new Date(line.expiryDate) : null,
              supplierName: data.supplierName ?? null,
              createdById: actor?.id ?? null,
            },
          });
          batchId = batch.id;
        }

        if (serialList && serialList.length > 0) {
          for (const sn of serialList) {
            await tx.inventorySerial.upsert({
              where: {
                itemId_serialNumber: {
                  itemId: line.itemId,
                  serialNumber: sn,
                },
              },
              update: {
                status: 'IN_STOCK',
                currentStoreId: data.storeId,
                currentBinId: line.binId ?? null,
                batchId,
              },
              create: {
                itemId: line.itemId,
                serialNumber: sn,
                status: 'IN_STOCK',
                currentStoreId: data.storeId,
                currentBinId: line.binId ?? null,
                batchId,
                createdById: actor?.id ?? null,
              },
            });
          }
        }

        preparedLines.push({
          itemId: line.itemId,
          quantity: qty,
          uomId: line.uomId,
          unitPrice: unitCost,
          batchNumber: batchNum ?? null,
          expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
          serialNumbers: serialList,
          binId: line.binId ?? null,
          batchId,
          notes: line.notes ?? null,
        });
      }

      const receipt = await tx.inventoryReceipt.create({
        data: {
          organization: { connect: { id: data.organizationId } },
          ...(data.communityId ? { community: { connect: { id: data.communityId } } } : {}),
          receiptNumber,
          store: { connect: { id: data.storeId } },
          sourceType: data.sourceType ?? 'MANUAL_RECEIPT',
          sourceReference: data.sourceReference ?? null,
          supplierName: data.supplierName ?? null,
          status: 'POSTED',
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
          receivedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
          notes: data.notes ?? null,
          documentId: data.documentId ?? null,
          lines: {
            create: preparedLines.map((l) => ({
              item: { connect: { id: l.itemId } },
              quantity: l.quantity,
              uom: { connect: { id: l.uomId } },
              unitPrice: l.unitPrice,
              batchNumber: l.batchNumber,
              expiryDate: l.expiryDate,
              serialNumbers: l.serialNumbers,
              ...(l.binId ? { bin: { connect: { id: l.binId } } } : {}),
              ...(l.batchId ? { batch: { connect: { id: l.batchId } } } : {}),
              notes: l.notes,
            })),
          },
        },
        include: {
          store: true,
          lines: {
            include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
          },
          receivedByUser: true,
        },
      });

      for (const line of receipt.lines) {
        await this.stockLedgerService.recordMovement(
          {
            organizationId: data.organizationId,
            communityId: data.communityId,
            storeId: data.storeId,
            binId: line.binId,
            itemId: line.itemId,
            batchId: line.batchId,
            transactionType: 'RECEIPT',
            quantityDelta: Number(line.quantity),
            uom: line.uom.code,
            referenceType: 'RECEIPT',
            referenceId: receipt.id,
            notes: `Goods Receipt ${receipt.receiptNumber}`,
            onHandDelta: Number(line.quantity),
            reservedDelta: 0,
          },
          actor,
          tx,
        );
      }

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_RECEIPT_POSTED,
          {
            receiptId: receipt.id,
            receiptNumber: receipt.receiptNumber,
            storeId: receipt.storeId,
            lineCount: receipt.lines.length,
            totalQuantity: receipt.lines.reduce((s, l) => s + Number(l.quantity), 0),
          },
          {
            organizationId: data.organizationId,
            communityId: data.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return receipt as any;
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
    return this.receiptRepo.findAll(params);
  }

  async findById(id: string): Promise<InventoryReceipt> {
    const receipt = await this.receiptRepo.findById(id);
    if (!receipt) {
      throw new NotFoundException(`Inventory receipt '${id}' not found`);
    }
    return receipt as any;
  }

  async reverseReceipt(id: string, reason: string, actor: Actor): Promise<InventoryReceipt> {
    const receipt = await this.findById(id);
    if (receipt.status !== 'POSTED') {
      throw new BadRequestException(
        `Only POSTED receipts can be reversed. Current status: ${receipt.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const line of receipt.lines as any[]) {
        await this.stockLedgerService.recordMovement(
          {
            organizationId: receipt.organizationId,
            communityId: receipt.communityId,
            storeId: receipt.storeId,
            binId: line.binId,
            itemId: line.itemId,
            batchId: line.batchId,
            transactionType: 'REVERSAL',
            quantityDelta: -Number(line.quantity),
            uom: line.uom?.code || 'UNIT',
            referenceType: 'RECEIPT',
            referenceId: receipt.id,
            notes: `Reversal of Receipt ${receipt.receiptNumber}: ${reason}`,
            onHandDelta: -Number(line.quantity),
            reservedDelta: 0,
          },
          actor,
          tx,
        );
      }

      const updated = await tx.inventoryReceipt.update({
        where: { id },
        data: {
          status: 'REVERSED',
          notes: receipt.notes
            ? `${receipt.notes}\n[REVERSED]: ${reason}`
            : `[REVERSED]: ${reason}`,
        },
        include: {
          store: true,
          lines: {
            include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
          },
          receivedByUser: true,
        },
      });

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.INVENTORY_RECEIPT_REVERSED,
          {
            receiptId: receipt.id,
            receiptNumber: receipt.receiptNumber,
            storeId: receipt.storeId,
          },
          {
            organizationId: receipt.organizationId,
            communityId: receipt.communityId ?? undefined,
            userId: actor?.id,
          },
        ),
      );

      return updated as any;
    });
  }
}
