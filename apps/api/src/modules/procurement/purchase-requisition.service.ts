import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PurchaseRequisitionRepository } from './purchase-requisition.repository.js';
import { ProcurementSequenceService } from './sequence.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, PurchaseRequisition } from '@community-os/types';

@Injectable()
export class PurchaseRequisitionService {
  constructor(
    private readonly prRepo: PurchaseRequisitionRepository,
    private readonly sequenceService: ProcurementSequenceService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createRequisition(
    data: {
      organizationId: string;
      communityId: string;
      title: string;
      description?: string | null;
      requestType?: any;
      priority?: any;
      requestingDepartment?: string | null;
      requiredByDate?: string | null;
      targetStoreId?: string | null;
      sourceType?: any;
      sourceReferenceId?: string | null;
      currency?: string;
      justification?: string | null;
      lines: Array<{
        lineType?: any;
        inventoryItemId?: string | null;
        serviceCategoryKey?: string | null;
        description: string;
        specification?: string | null;
        quantity: number;
        uomId?: string | null;
        uomName?: string | null;
        estimatedUnitPrice?: number | null;
        requiredByDate?: string | null;
        targetStoreId?: string | null;
        linkedWorkOrderId?: string | null;
        linkedWorkOrderMaterialRequirementId?: string | null;
        linkedAssetId?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<PurchaseRequisition> {
    if (!data.lines || data.lines.length === 0) {
      throw new BadRequestException('Requisition must have at least one line item');
    }

    const requisitionNumber = await this.sequenceService.getNextNumber(
      data.organizationId,
      data.communityId,
      'PURCHASE_REQUISITION',
      'PR',
    );

    let estimatedTotal = 0;
    const linesCreate = data.lines.map((l, idx) => {
      const lineTotal = l.estimatedUnitPrice ? l.quantity * l.estimatedUnitPrice : 0;
      estimatedTotal += lineTotal;
      return {
        lineNumber: idx + 1,
        lineType: l.lineType ?? 'CATALOG_ITEM',
        inventoryItemId: l.inventoryItemId ?? null,
        serviceCategoryKey: l.serviceCategoryKey ?? null,
        description: l.description,
        specification: l.specification ?? null,
        quantity: l.quantity,
        uomId: l.uomId ?? null,
        uomName: l.uomName ?? null,
        estimatedUnitPrice: l.estimatedUnitPrice ?? null,
        estimatedTotalPrice: lineTotal > 0 ? lineTotal : null,
        requiredByDate: l.requiredByDate ? new Date(l.requiredByDate) : null,
        targetStoreId: l.targetStoreId ?? data.targetStoreId ?? null,
        linkedWorkOrderId: l.linkedWorkOrderId ?? null,
        linkedWorkOrderMaterialRequirementId: l.linkedWorkOrderMaterialRequirementId ?? null,
        linkedAssetId: l.linkedAssetId ?? null,
      };
    });

    const pr = await this.prRepo.create({
      organization: { connect: { id: data.organizationId } },
      community: { connect: { id: data.communityId } },
      requisitionNumber,
      title: data.title,
      description: data.description ?? null,
      requestType: data.requestType ?? 'GOODS',
      priority: data.priority ?? 'NORMAL',
      requestingDepartment: data.requestingDepartment ?? null,
      requestedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      requiredByDate: data.requiredByDate ? new Date(data.requiredByDate) : null,
      targetStore: data.targetStoreId ? { connect: { id: data.targetStoreId } } : undefined,
      sourceType: data.sourceType ?? 'MANUAL',
      sourceReferenceId: data.sourceReferenceId ?? null,
      currency: data.currency ?? 'INR',
      estimatedTotalAmount: estimatedTotal,
      justification: data.justification ?? null,
      status: 'DRAFT',
      lines: { create: linesCreate },
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_REQUISITION_CREATED ?? 'purchase_requisition.created.v1',
        {
          requisitionNumber: pr.requisitionNumber,
          title: pr.title,
        },
        {
          organizationId: data.organizationId,
          communityId: data.communityId,
          userId: actor?.id,
        },
      ),
    );

    return pr as unknown as PurchaseRequisition;
  }

  async createFromWorkOrderShortage(
    params: {
      organizationId: string;
      communityId: string;
      workOrderId: string;
    },
    actor: Actor,
  ) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: params.workOrderId },
      include: {
        materialRequirements: {
          include: { item: true, uom: true },
        },
      },
    });

    if (!wo) throw new NotFoundException('Work order not found');

    const lines = wo.materialRequirements.map((mat) => {
      const shortQty = Math.max(0, Number(mat.requiredQty) - Number(mat.issuedQty));
      return {
        lineType: 'CATALOG_ITEM' as any,
        inventoryItemId: mat.itemId,
        description: `Material shortage for ${wo.workOrderNumber}: ${mat.item?.name ?? 'Item'}`,
        quantity: shortQty > 0 ? shortQty : Number(mat.requiredQty),
        uomId: mat.uomId,
        uomName: mat.uom?.name,
        linkedWorkOrderId: wo.id,
        linkedWorkOrderMaterialRequirementId: mat.id,
      };
    });

    return this.createRequisition(
      {
        organizationId: params.organizationId,
        communityId: params.communityId,
        title: `Material Shortage PR for ${wo.workOrderNumber}`,
        description: `Automatically created from Work Order ${wo.workOrderNumber} material requirements`,
        sourceType: 'WORK_ORDER_MATERIAL_SHORTAGE',
        sourceReferenceId: wo.id,
        priority: 'HIGH',
        lines,
      },
      actor,
    );
  }

  async createFromReorderSuggestions(
    params: {
      organizationId: string;
      communityId: string;
      storeId?: string;
      itemIds?: string[];
    },
    actor: Actor,
  ) {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        organizationId: params.organizationId,
        status: 'ACTIVE',
        ...(params.itemIds && params.itemIds.length > 0 ? { id: { in: params.itemIds } } : {}),
      },
      include: { baseUom: true, balances: true },
    });

    const lines: any[] = [];
    for (const item of items) {
      const totalAvailable = (item as any).balances
        ? (item as any).balances.reduce(
            (sum: number, b: any) => sum + Number(b.quantityAvailable),
            0,
          )
        : 0;
      const minLevel = Number(item.minStockLevel || 0);
      const reorderQty = Number(item.reorderLevel || minLevel * 2);

      if (totalAvailable <= minLevel || (params.itemIds && params.itemIds.includes(item.id))) {
        lines.push({
          lineType: 'CATALOG_ITEM',
          inventoryItemId: item.id,
          description: `Inventory replenishment for ${item.name} (${item.itemCode})`,
          quantity: reorderQty > 0 ? reorderQty : 10,
          uomId: item.baseUomId,
          uomName: item.baseUom?.name,
          estimatedUnitPrice: null,
        });
      }
    }

    if (lines.length === 0) {
      throw new BadRequestException('No items found requiring reorder');
    }

    return this.createRequisition(
      {
        organizationId: params.organizationId,
        communityId: params.communityId,
        title: `Inventory Replenishment PR - ${new Date().toLocaleDateString()}`,
        description: 'Generated from inventory reorder point shortage suggestions',
        sourceType: 'INVENTORY_REORDER',
        lines,
      },
      actor,
    );
  }

  async submitRequisition(id: string, organizationId: string, actor: Actor) {
    const pr = await this.prRepo.findById(id, organizationId);
    if (!pr) throw new NotFoundException('Purchase Requisition not found');

    const updated = await this.prRepo.update(id, organizationId, {
      status: 'SUBMITTED',
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_REQUISITION_SUBMITTED ??
          'purchase_requisition.submitted.v1',
        {
          requisitionId: id,
        },
        {
          organizationId,
          communityId: pr.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async approveRequisition(id: string, organizationId: string, actor: Actor) {
    const pr = await this.prRepo.findById(id, organizationId);
    if (!pr) throw new NotFoundException('Purchase Requisition not found');

    const updated = await this.prRepo.update(id, organizationId, {
      status: 'APPROVED',
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PURCHASE_REQUISITION_APPROVED ?? 'purchase_requisition.approved.v1',
        {
          requisitionId: id,
          approvedById: actor?.id,
        },
        {
          organizationId,
          communityId: pr.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async getRequisition(id: string, organizationId?: string) {
    const pr = await this.prRepo.findById(id, organizationId);
    if (!pr) throw new NotFoundException('Purchase Requisition not found');
    return pr;
  }

  async listRequisitions(params: {
    organizationId: string;
    communityId?: string;
    status?: any;
    requestType?: any;
    priority?: any;
    sourceType?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prRepo.findMany(params);
  }
}
