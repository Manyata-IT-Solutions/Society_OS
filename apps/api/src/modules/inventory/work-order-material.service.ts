import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkOrderMaterialRepository } from './work-order-material.repository.js';
import { StockReservationService } from './stock-reservation.service.js';
import { InventoryReturnService } from './inventory-return.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type {
  Actor,
  WorkOrderMaterialRequirement,
  WorkOrderMaterialConsumption,
} from '@community-os/types';

@Injectable()
export class WorkOrderMaterialService {
  constructor(
    private readonly materialRepo: WorkOrderMaterialRepository,
    private readonly reservationService: StockReservationService,
    private readonly returnService: InventoryReturnService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createRequirement(
    workOrderId: string,
    data: {
      itemId: string;
      requiredQty: number;
      uomId: string;
      priority?: any;
      preferredStoreId?: string | null;
      notes?: string | null;
    },
    actor: Actor,
  ): Promise<WorkOrderMaterialRequirement> {
    const requirement = await this.materialRepo.createRequirement({
      workOrder: { connect: { id: workOrderId } },
      item: { connect: { id: data.itemId } },
      requiredQty: data.requiredQty,
      uom: { connect: { id: data.uomId } },
      priority: data.priority ?? 'NORMAL',
      preferredStoreId: data.preferredStoreId ?? null,
      notes: data.notes ?? null,
      requestedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
    } as any);

    this.eventsService.publish(
      createEvent(
        DOMAIN_EVENTS.WORK_ORDER_MATERIAL_REQUESTED,
        {
          requirementId: requirement.id,
          workOrderId,
          itemId: data.itemId,
          requiredQty: data.requiredQty,
        },
        { userId: actor?.id },
      ),
    );

    return requirement as any;
  }

  async getRequirements(workOrderId: string): Promise<WorkOrderMaterialRequirement[]> {
    return this.materialRepo.findRequirementsByWorkOrder(workOrderId) as any;
  }

  async reserveStockForWorkOrder(
    workOrderId: string,
    data: {
      organizationId?: string;
      communityId?: string | null;
      storeId?: string;
      itemId?: string;
      requirementId?: string | null;
      batchId?: string | null;
      quantity: number;
      expiresAt?: Date | string | null;
    },
    actor: Actor,
  ) {
    let orgId = data.organizationId;
    let commId = data.communityId;
    let itemId = data.itemId;
    let storeId = data.storeId;

    if (data.requirementId && (!orgId || !itemId || !storeId)) {
      const req = await this.prisma.workOrderMaterialRequirement.findUnique({
        where: { id: data.requirementId },
        include: { workOrder: true },
      });
      if (req) {
        if (!itemId) itemId = req.itemId;
        if (!storeId && req.preferredStoreId) storeId = req.preferredStoreId;
        if (!orgId) orgId = req.workOrder.organizationId;
        if (!commId) commId = req.workOrder.communityId;
      }
    }

    if (!orgId || !itemId || !storeId) {
      const wo = await this.prisma.workOrder.findUnique({ where: { id: workOrderId } });
      if (wo) {
        if (!orgId) orgId = wo.organizationId;
        if (!commId) commId = wo.communityId;
      }
    }

    return this.reservationService.reserveStock(
      {
        organizationId: orgId!,
        communityId: commId,
        storeId: storeId!,
        itemId: itemId!,
        workOrderId,
        requirementId: data.requirementId,
        batchId: data.batchId,
        quantity: data.quantity,
        expiresAt: data.expiresAt,
      },
      actor,
    );
  }

  async recordConsumption(
    workOrderId: string,
    data: {
      issueLineId?: string | null;
      itemId: string;
      assetId?: string | null;
      batchId?: string | null;
      serialId?: string | null;
      quantity: number;
      uomId?: string;
      requirementId?: string | null;
      notes?: string | null;
    },
    actor: Actor,
  ): Promise<WorkOrderMaterialConsumption> {
    return this.prisma.$transaction(async (tx) => {
      let issueLineId = data.issueLineId;
      let uomId = data.uomId;

      if (!issueLineId) {
        const matchingLine = await tx.inventoryIssueLine.findFirst({
          where: {
            issue: { workOrderId },
            itemId: data.itemId,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (matchingLine) {
          issueLineId = matchingLine.id;
          if (!uomId) uomId = matchingLine.uomId;
        }
      }

      if (!uomId) {
        const itm = await tx.inventoryItem.findUnique({ where: { id: data.itemId } });
        if (itm) uomId = itm.baseUomId;
      }

      if (issueLineId) {
        await tx.inventoryIssueLine.update({
          where: { id: issueLineId },
          data: { consumedQty: { increment: data.quantity } },
        });
      }

      if (data.requirementId) {
        await tx.workOrderMaterialRequirement.update({
          where: { id: data.requirementId },
          data: {
            consumedQty: { increment: data.quantity },
            status: 'FULFILLED',
          },
        });
      }

      if (data.serialId) {
        await tx.inventorySerial.update({
          where: { id: data.serialId },
          data: { status: data.assetId ? 'INSTALLED' : 'CONSUMED' },
        });
      }

      const consumption = await tx.workOrderMaterialConsumption.create({
        data: {
          workOrder: { connect: { id: workOrderId } },
          ...(issueLineId ? { issueLine: { connect: { id: issueLineId } } } : {}),
          item: { connect: { id: data.itemId } },
          ...(data.assetId ? { asset: { connect: { id: data.assetId } } } : {}),
          ...(data.batchId ? { batch: { connect: { id: data.batchId } } } : {}),
          ...(data.serialId ? { serial: { connect: { id: data.serialId } } } : {}),
          quantity: data.quantity,
          uom: { connect: { id: uomId! } },
          notes: data.notes ?? null,
          ...(actor?.id ? { recordedByUser: { connect: { id: actor.id } } } : {}),
        } as any,
        include: {
          item: { include: { baseUom: true } },
          uom: true,
          asset: true,
          batch: true,
          serial: true,
          recordedByUser: true,
        },
      });

      this.eventsService.publish(
        createEvent(
          DOMAIN_EVENTS.WORK_ORDER_MATERIAL_CONSUMED,
          {
            consumptionId: consumption.id,
            workOrderId,
            itemId: data.itemId,
            quantity: data.quantity,
          },
          {
            userId: actor?.id,
          },
        ),
      );

      return consumption as any;
    });
  }

  async returnUnusedMaterial(
    workOrderId: string,
    data: {
      storeId: string;
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
      notes?: string | null;
    },
    actor: Actor,
  ) {
    const wo = await this.prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!wo) {
      throw new NotFoundException(`Work order '${workOrderId}' not found`);
    }

    return this.returnService.createReturn(
      {
        organizationId: wo.organizationId,
        communityId: wo.communityId,
        storeId: data.storeId,
        returnType: 'WORK_ORDER_UNUSED',
        workOrderId,
        notes: data.notes,
        lines: data.lines,
      },
      actor,
    );
  }

  async returnUnusedMaterials(workOrderId: string, data: any, actor: Actor) {
    return this.returnUnusedMaterial(workOrderId, data, actor);
  }

  async getConsumptions(workOrderId: string): Promise<WorkOrderMaterialConsumption[]> {
    return this.materialRepo.findConsumptionsByWorkOrder(workOrderId) as any;
  }
}
