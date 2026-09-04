import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseOrderRepository } from './purchase-order.repository.js';
import { ProcurementSequenceService } from './sequence.service.js';
import { VendorEligibilityService } from '../vendor/vendor-eligibility.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, PurchaseOrder } from '@community-os/types';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly poRepo: PurchaseOrderRepository,
    private readonly sequenceService: ProcurementSequenceService,
    private readonly vendorEligibility: VendorEligibilityService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createPurchaseOrder(
    data: {
      organizationId: string;
      communityId: string;
      vendorId: string;
      sourceAwardId?: string | null;
      currency?: string;
      poType?: any;
      orderDate?: string;
      deliveryRequiredBy?: string | null;
      deliveryAddress?: string | null;
      billingAddress?: string | null;
      paymentTerms?: string | null;
      deliveryTerms?: string | null;
      warrantyTerms?: string | null;
      termsAndConditions?: string | null;
      lines: Array<{
        sourcePrLineId?: string | null;
        sourceRfqLineId?: string | null;
        sourceQuotationLineId?: string | null;
        lineType?: any;
        inventoryItemId?: string | null;
        serviceCategoryKey?: string | null;
        description: string;
        specificationSnapshot?: string | null;
        orderedQty: number;
        uomId?: string | null;
        uomName?: string | null;
        unitPrice: number;
        discountAmount?: number;
        taxAmount?: number;
        targetStoreId?: string | null;
        linkedWorkOrderId?: string | null;
        linkedWorkOrderMaterialRequirementId?: string | null;
        linkedAssetId?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<PurchaseOrder> {
    if (!data.lines || data.lines.length === 0) {
      throw new BadRequestException('Purchase Order must have at least one line item');
    }

    const poNumber = await this.sequenceService.getNextNumber(
      data.organizationId,
      data.communityId,
      'PURCHASE_ORDER',
      'PO',
    );

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const linesCreate = data.lines.map((l, idx) => {
      const lineSub = l.orderedQty * l.unitPrice;
      const lineDisc = l.discountAmount ?? 0;
      const lineTax = l.taxAmount ?? 0;
      const lineTot = lineSub - lineDisc + lineTax;

      subtotal += lineSub;
      discountTotal += lineDisc;
      taxTotal += lineTax;

      return {
        lineNumber: idx + 1,
        lineType: l.lineType ?? 'CATALOG_ITEM',
        sourcePrLineId: l.sourcePrLineId ?? null,
        sourceRfqLineId: l.sourceRfqLineId ?? null,
        sourceQuotationLineId: l.sourceQuotationLineId ?? null,
        inventoryItemId: l.inventoryItemId ?? null,
        serviceCategoryKey: l.serviceCategoryKey ?? null,
        description: l.description,
        specificationSnapshot: l.specificationSnapshot ?? null,
        orderedQty: l.orderedQty,
        uomId: l.uomId ?? null,
        uomName: l.uomName ?? null,
        unitPrice: l.unitPrice,
        discountAmount: lineDisc,
        taxAmount: lineTax,
        lineTotal: lineTot,
        remainingQty: l.orderedQty,
        targetStoreId: l.targetStoreId ?? null,
        linkedWorkOrderId: l.linkedWorkOrderId ?? null,
        linkedWorkOrderMaterialRequirementId: l.linkedWorkOrderMaterialRequirementId ?? null,
        linkedAssetId: l.linkedAssetId ?? null,
      };
    });

    const grandTotal = subtotal - discountTotal + taxTotal;

    const po = await this.poRepo.create({
      organization: { connect: { id: data.organizationId } },
      community: { connect: { id: data.communityId } },
      vendor: { connect: { id: data.vendorId } },
      poNumber,
      sourceAward: data.sourceAwardId ? { connect: { id: data.sourceAwardId } } : undefined,
      currency: data.currency ?? 'INR',
      poType: data.poType ?? 'GOODS',
      orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
      deliveryRequiredBy: data.deliveryRequiredBy ? new Date(data.deliveryRequiredBy) : null,
      deliveryAddress: data.deliveryAddress ?? null,
      billingAddress: data.billingAddress ?? null,
      paymentTerms: data.paymentTerms ?? null,
      deliveryTerms: data.deliveryTerms ?? null,
      warrantyTerms: data.warrantyTerms ?? null,
      termsAndConditions: data.termsAndConditions ?? null,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      status: 'DRAFT',
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      lines: { create: linesCreate },
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_ORDER_CREATED ?? 'purchase_order.created.v1',
        {
          poNumber: po.poNumber,
          vendorId: data.vendorId,
          grandTotal,
        },
        {
          organizationId: data.organizationId,
          communityId: data.communityId,
          userId: actor?.id,
        },
      ),
    );

    return po as unknown as PurchaseOrder;
  }

  async createFromAward(awardId: string, actor: Actor) {
    const award = await this.prisma.sourcingAward.findUnique({
      where: { id: awardId },
      include: {
        rfq: { include: { lines: true } },
        lines: {
          include: {
            quotation: true,
            quotationLine: true,
            rfqLine: true,
          },
        },
      },
    });

    if (!award) throw new NotFoundException('Sourcing Award not found');
    if (award.status !== 'APPROVED') {
      throw new BadRequestException('Cannot generate Purchase Order from unapproved award');
    }

    // If split award, group by vendor
    const vendorMap = new Map<string, any[]>();
    for (const line of award.lines) {
      const vId = line.vendorId;
      if (!vendorMap.has(vId)) vendorMap.set(vId, []);
      vendorMap.get(vId)!.push(line);
    }

    const createdPOs: any[] = [];
    for (const [vId, vLines] of vendorMap.entries()) {
      const poLines = vLines.map((l) => ({
        sourcePrLineId: l.rfqLine?.sourcePrLineId ?? null,
        sourceRfqLineId: l.rfqLineId,
        sourceQuotationLineId: l.quotationLineId,
        lineType: l.rfqLine?.lineType ?? 'CATALOG_ITEM',
        inventoryItemId: l.rfqLine?.inventoryItemId ?? null,
        description: l.rfqLine?.description ?? 'Procurement Item',
        specificationSnapshot: l.rfqLine?.specification ?? null,
        orderedQty: Number(l.awardedQuantity),
        uomId: l.uomId ?? l.rfqLine?.uomId ?? null,
        unitPrice: Number(l.unitPrice),
      }));

      const po = await this.createPurchaseOrder(
        {
          organizationId: award.organizationId,
          communityId: award.communityId,
          vendorId: vId,
          sourceAwardId: award.id,
          currency: award.rfq.currency,
          lines: poLines,
        },
        actor,
      );
      createdPOs.push(po);
    }

    await this.prisma.sourcingAward.update({
      where: { id: awardId },
      data: { status: 'PO_CREATED' },
    });

    return createdPOs;
  }

  async approvePurchaseOrder(id: string, actor: Actor) {
    const po = await this.poRepo.findById(id);
    if (!po) throw new NotFoundException('Purchase Order not found');

    const updated = await this.poRepo.update(id, {
      status: 'APPROVED',
      approvedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      approvedAt: new Date(),
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_ORDER_APPROVED ?? 'purchase_order.approved.v1',
        {
          poId: id,
          poNumber: po.poNumber,
        },
        {
          organizationId: po.organizationId,
          communityId: po.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async issuePurchaseOrder(id: string, actor: Actor) {
    const po = await this.poRepo.findById(id);
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (po.status !== 'APPROVED') {
      throw new BadRequestException('PO must be approved before issuance');
    }

    const updated = await this.poRepo.update(id, {
      status: 'ISSUED',
      issuedAt: new Date(),
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_ORDER_ISSUED ?? 'purchase_order.issued.v1',
        {
          poId: id,
          poNumber: po.poNumber,
          vendorId: po.vendorId,
        },
        {
          organizationId: po.organizationId,
          communityId: po.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async amendPurchaseOrder(
    id: string,
    data: {
      changeReason: string;
      lines: Array<{
        id?: string;
        description: string;
        orderedQty: number;
        unitPrice: number;
        discountAmount?: number;
        taxAmount?: number;
        uomId?: string | null;
      }>;
      paymentTerms?: string | null;
      deliveryTerms?: string | null;
      deliveryRequiredBy?: string | null;
    },
    actor: Actor,
  ) {
    const po = await this.poRepo.findById(id);
    if (!po) throw new NotFoundException('Purchase Order not found');

    // Create revision snapshot of current state
    const snapshotData = {
      poNumber: po.poNumber,
      revision: po.revision,
      subtotal: po.subtotal,
      grandTotal: po.grandTotal,
      lines: po.lines,
    };

    await this.prisma.purchaseOrderRevision.create({
      data: {
        purchaseOrderId: id,
        revisionNumber: po.revision,
        changeReason: data.changeReason,
        snapshotData,
        amendedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      } as any,
    });

    // Update lines and calculate new totals
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    for (const line of data.lines) {
      const lineSub = line.orderedQty * line.unitPrice;
      const lineDisc = line.discountAmount ?? 0;
      const lineTax = line.taxAmount ?? 0;
      subtotal += lineSub;
      discountTotal += lineDisc;
      taxTotal += lineTax;

      if (line.id) {
        await this.prisma.purchaseOrderLine.update({
          where: { id: line.id },
          data: {
            description: line.description,
            orderedQty: line.orderedQty,
            unitPrice: line.unitPrice,
            discountAmount: lineDisc,
            taxAmount: lineTax,
            lineTotal: lineSub - lineDisc + lineTax,
            remainingQty: line.orderedQty, // reset remaining
          },
        });
      }
    }

    const grandTotal = subtotal - discountTotal + taxTotal;

    const updated = await this.poRepo.update(id, {
      revision: po.revision + 1,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : po.paymentTerms,
      deliveryTerms: data.deliveryTerms !== undefined ? data.deliveryTerms : po.deliveryTerms,
      deliveryRequiredBy: data.deliveryRequiredBy
        ? new Date(data.deliveryRequiredBy)
        : po.deliveryRequiredBy,
      status: 'UNDER_APPROVAL', // Requires re-approval after amendment
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_ORDER_AMENDED ?? 'purchase_order.amended.v1',
        {
          poId: id,
          newRevision: updated.revision,
          changeReason: data.changeReason,
        },
        {
          organizationId: po.organizationId,
          communityId: po.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async acknowledgePurchaseOrder(
    id: string,
    data: { status: any; notes?: string | null },
    actor: Actor,
  ) {
    const po = await this.poRepo.findById(id);
    if (!po) throw new NotFoundException('Purchase Order not found');

    const updated = await this.poRepo.update(id, {
      vendorAcknowledgementStatus: data.status,
      vendorAcknowledgedAt: new Date(),
      vendorAcknowledgementNotes: data.notes ?? null,
      status:
        data.status === 'ACCEPTED' || data.status === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : po.status,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_ORDER_ACKNOWLEDGED ?? 'purchase_order.acknowledged.v1',
        {
          poId: id,
          status: data.status,
        },
        {
          organizationId: po.organizationId,
          communityId: po.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async shortClosePurchaseOrder(id: string, reason: string, actor: Actor) {
    const po = await this.poRepo.findById(id);
    if (!po) throw new NotFoundException('Purchase Order not found');

    const updated = await this.poRepo.update(id, {
      status: 'SHORT_CLOSED',
      shortClosedAt: new Date(),
      shortCloseReason: reason,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_ORDER_SHORT_CLOSED ?? 'purchase_order.short_closed.v1',
        {
          poId: id,
          reason,
        },
        {
          organizationId: po.organizationId,
          communityId: po.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async getPurchaseOrder(id: string, organizationId?: string) {
    const po = await this.poRepo.findById(id, organizationId);
    if (!po) throw new NotFoundException('Purchase Order not found');
    return po;
  }

  async listPurchaseOrders(params: {
    organizationId: string;
    communityId?: string;
    vendorId?: string;
    status?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return this.poRepo.findMany(params);
  }
}
