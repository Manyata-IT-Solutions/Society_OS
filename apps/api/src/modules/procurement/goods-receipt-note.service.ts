import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GoodsReceiptNoteRepository } from './goods-receipt-note.repository.js';
import { ProcurementSequenceService } from './sequence.service.js';
import { InventoryReceiptService } from '../inventory/inventory-receipt.service.js';
import { VendorPerformanceService } from '../vendor/vendor-performance.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, GoodsReceiptNote } from '@community-os/types';

@Injectable()
export class GoodsReceiptNoteService {
  constructor(
    private readonly grnRepo: GoodsReceiptNoteRepository,
    private readonly sequenceService: ProcurementSequenceService,
    private readonly inventoryReceiptService: InventoryReceiptService,
    private readonly vendorPerformanceService: VendorPerformanceService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createGrn(
    data: {
      organizationId: string;
      communityId: string;
      purchaseOrderId: string;
      storeId: string;
      deliveryChallanNumber?: string | null;
      vendorInvoiceReference?: string | null;
      receivedAt?: string;
      notes?: string | null;
      lines: Array<{
        poLineId: string;
        deliveredQty: number;
        acceptedQty?: number;
        rejectedQty?: number;
        damagedQty?: number;
        uomId?: string | null;
        binId?: string | null;
        batchNumber?: string | null;
        expiryDate?: string | null;
        serialNumbers?: string[];
        rejectionReason?: string | null;
        rejectionDisposition?: any;
        notes?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<GoodsReceiptNote> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: { lines: true },
    });

    if (!po) throw new NotFoundException('Purchase Order not found');
    if (
      po.status !== 'ISSUED' &&
      po.status !== 'ACKNOWLEDGED' &&
      po.status !== 'PARTIALLY_RECEIVED'
    ) {
      throw new BadRequestException(`Cannot receive goods for PO in ${po.status} status`);
    }

    // Atomic check: Verify deliveredQty <= remainingQty on each PO line (concurrency protection)
    for (const l of data.lines) {
      const poLine = po.lines.find((pl) => pl.id === l.poLineId);
      if (!poLine)
        throw new BadRequestException(`PO line ${l.poLineId} does not belong to this PO`);
      if (l.deliveredQty > Number(poLine.remainingQty)) {
        throw new BadRequestException(
          `Over-receipt blocked: Delivered qty (${l.deliveredQty}) exceeds remaining qty (${poLine.remainingQty}) on line ${poLine.lineNumber}`,
        );
      }
    }

    const grnNumber = await this.sequenceService.getNextNumber(
      data.organizationId,
      data.communityId,
      'GOODS_RECEIPT_NOTE',
      'GRN',
    );

    const grn = await this.grnRepo.create({
      organization: { connect: { id: data.organizationId } },
      community: { connect: { id: data.communityId } },
      purchaseOrder: { connect: { id: data.purchaseOrderId } },
      vendor: { connect: { id: po.vendorId } },
      store: { connect: { id: data.storeId } },
      grnNumber,
      deliveryChallanNumber: data.deliveryChallanNumber ?? null,
      vendorInvoiceReference: data.vendorInvoiceReference ?? null,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
      receivedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      status: 'RECEIVED',
      inspectionStatus: 'PENDING',
      notes: data.notes ?? null,
      lines: {
        create: data.lines.map((l, idx) => ({
          lineNumber: idx + 1,
          poLineId: l.poLineId,
          deliveredQty: l.deliveredQty,
          acceptedQty: l.acceptedQty ?? l.deliveredQty, // default to delivered until inspected
          rejectedQty: l.rejectedQty ?? 0,
          damagedQty: l.damagedQty ?? 0,
          uomId: l.uomId ?? null,
          binId: l.binId ?? null,
          batchNumber: l.batchNumber ?? null,
          expiryDate: l.expiryDate ? new Date(l.expiryDate) : null,
          serialNumbers: l.serialNumbers ?? [],
          rejectionReason: l.rejectionReason ?? null,
          rejectionDisposition: l.rejectionDisposition ?? null,
          notes: l.notes ?? null,
        })),
      },
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).GRN_CREATED ?? 'grn.created.v1',
        {
          grnNumber: grn.grnNumber,
          poId: data.purchaseOrderId,
        },
        {
          organizationId: data.organizationId,
          communityId: data.communityId,
          userId: actor?.id,
        },
      ),
    );

    return grn as unknown as GoodsReceiptNote;
  }

  async recordInspection(
    id: string,
    data: {
      inspectionStatus: any;
      comments?: string | null;
      lines: Array<{
        grnLineId: string;
        acceptedQty: number;
        rejectedQty: number;
        damagedQty?: number;
        rejectionReason?: string | null;
        rejectionDisposition?: any;
      }>;
    },
    actor: Actor,
  ) {
    const grn = await this.grnRepo.findById(id);
    if (!grn) throw new NotFoundException('GRN not found');

    for (const l of data.lines) {
      await this.prisma.grnLine.update({
        where: { id: l.grnLineId },
        data: {
          acceptedQty: l.acceptedQty,
          rejectedQty: l.rejectedQty,
          damagedQty: l.damagedQty ?? 0,
          rejectionReason: l.rejectionReason ?? null,
          rejectionDisposition: l.rejectionDisposition ?? null,
        },
      });
    }

    const updated = await this.grnRepo.update(id, {
      inspectionStatus: data.inspectionStatus,
      inspectionComments: data.comments ?? null,
      inspectedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      inspectedAt: new Date(),
      status:
        data.inspectionStatus === 'PASSED'
          ? 'ACCEPTED'
          : data.inspectionStatus === 'CONDITIONALLY_PASSED'
            ? 'PARTIALLY_ACCEPTED'
            : 'REJECTED',
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).GRN_INSPECTED ?? 'grn.inspected.v1',
        {
          grnId: id,
          inspectionStatus: data.inspectionStatus,
        },
        {
          organizationId: grn.organizationId,
          communityId: grn.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async postGrnToInventory(id: string, actor: Actor) {
    const grn = await this.grnRepo.findById(id);
    if (!grn) throw new NotFoundException('GRN not found');
    if (grn.status === 'POSTED') {
      return grn; // Idempotent return
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Prepare lines for Phase 11 InventoryReceiptService (only accepted items)
      const receiptLines: any[] = [];
      for (const line of grn.lines) {
        if (Number(line.acceptedQty) > 0 && line.poLine?.inventoryItemId) {
          receiptLines.push({
            itemId: line.poLine.inventoryItemId,
            quantity: Number(line.acceptedQty),
            uomId: line.uomId || line.poLine.uomId,
            unitPrice: Number(line.poLine.unitPrice),
            batchNumber: line.batchNumber ?? null,
            expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
            serialNumbers: line.serialNumbers ?? [],
            binId: line.binId ?? null,
            notes: `GRN ${grn.grnNumber} line ${line.lineNumber}`,
          });
        }
      }

      let invReceiptId: string | null = null;
      if (receiptLines.length > 0) {
        const invReceipt = await this.inventoryReceiptService.createReceipt(
          {
            organizationId: grn.organizationId,
            communityId: grn.communityId,
            storeId: grn.storeId,
            sourceType: 'PURCHASE_ORDER' as any,
            sourceReference: grn.grnNumber,
            supplierName: grn.vendor.displayName || grn.vendor.legalName,
            receivedAt: grn.receivedAt,
            notes: `Received via GRN ${grn.grnNumber} against PO ${grn.purchaseOrder.poNumber}`,
            lines: receiptLines,
          },
          actor,
        );
        invReceiptId = invReceipt.id;
      }

      // 2. Update PO line received/accepted/remaining quantities
      let allFullyReceived = true;
      for (const line of grn.lines) {
        const poLine = grn.purchaseOrder.lines.find((pl) => pl.id === line.poLineId);
        if (poLine) {
          const newReceived = Number(poLine.receivedQty) + Number(line.deliveredQty);
          const newAccepted = Number(poLine.acceptedQty) + Number(line.acceptedQty);
          const newRejected = Number(poLine.rejectedQty) + Number(line.rejectedQty);
          const newRemaining = Math.max(0, Number(poLine.orderedQty) - newReceived);

          await tx.purchaseOrderLine.update({
            where: { id: poLine.id },
            data: {
              receivedQty: newReceived,
              acceptedQty: newAccepted,
              rejectedQty: newRejected,
              remainingQty: newRemaining,
            },
          });

          if (newRemaining > 0) {
            allFullyReceived = false;
          }
        }
      }

      // 3. Update PO status
      await tx.purchaseOrder.update({
        where: { id: grn.purchaseOrderId },
        data: {
          status: allFullyReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED',
        },
      });

      // 4. Mark GRN as POSTED
      const updatedGrn = await tx.goodsReceiptNote.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          inventoryReceiptId: invReceiptId,
        },
        include: {
          lines: { include: { uom: true } },
          purchaseOrder: true,
          vendor: true,
          store: true,
        },
      });

      // 5. Update vendor performance scorecard
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      await this.vendorPerformanceService.calculateVendorScorecard(
        grn.vendorId,
        periodStart,
        periodEnd,
      );

      return updatedGrn;
    });
  }

  async getGrn(id: string, organizationId?: string) {
    const grn = await this.grnRepo.findById(id, organizationId);
    if (!grn) throw new NotFoundException('GRN not found');
    return grn;
  }

  async listGrns(params: {
    organizationId: string;
    communityId?: string;
    purchaseOrderId?: string;
    vendorId?: string;
    storeId?: string;
    status?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return this.grnRepo.findMany(params);
  }
}
