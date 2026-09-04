import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceReceiptRepository } from './service-receipt.repository.js';
import { ProcurementSequenceService } from './sequence.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, ServiceReceiptNote } from '@community-os/types';

@Injectable()
export class ServiceReceiptService {
  constructor(
    private readonly srnRepo: ServiceReceiptRepository,
    private readonly sequenceService: ProcurementSequenceService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createServiceReceipt(
    data: {
      organizationId: string;
      communityId: string;
      purchaseOrderId: string;
      serviceStartDate?: string | null;
      serviceEndDate?: string | null;
      notes?: string | null;
      lines: Array<{
        poLineId: string;
        description: string;
        deliveredQty: number;
        acceptedQty: number;
        uomName?: string | null;
        notes?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<ServiceReceiptNote> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: { lines: true },
    });

    if (!po) throw new NotFoundException('Purchase Order not found');

    const srnNumber = await this.sequenceService.getNextNumber(
      data.organizationId,
      data.communityId,
      'SERVICE_RECEIPT_NOTE',
      'SRN',
    );

    const srn = await this.srnRepo.create({
      organization: { connect: { id: data.organizationId } },
      community: { connect: { id: data.communityId } },
      purchaseOrder: { connect: { id: data.purchaseOrderId } },
      vendor: { connect: { id: po.vendorId } },
      serviceReceiptNumber: srnNumber,
      serviceStartDate: data.serviceStartDate ? new Date(data.serviceStartDate) : null,
      serviceEndDate: data.serviceEndDate ? new Date(data.serviceEndDate) : null,
      notes: data.notes ?? null,
      status: 'DRAFT',
      verifiedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      lines: {
        create: data.lines.map((l) => ({
          poLineId: l.poLineId,
          description: l.description,
          deliveredQty: l.deliveredQty,
          acceptedQty: l.acceptedQty,
          uomName: l.uomName ?? null,
          notes: l.notes ?? null,
        })),
      },
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).SERVICE_RECEIPT_CREATED ?? 'service_receipt.created.v1',
        {
          srnNumber: srn.serviceReceiptNumber,
        },
        {
          organizationId: data.organizationId,
          communityId: data.communityId,
          userId: actor?.id,
        },
      ),
    );

    return srn as unknown as ServiceReceiptNote;
  }

  async acceptServiceReceipt(id: string, actor: Actor) {
    const srn = await this.srnRepo.findById(id);
    if (!srn) throw new NotFoundException('Service Receipt Note not found');

    const updated = await this.srnRepo.update(id, {
      status: 'ACCEPTED',
      acceptedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      acceptedAt: new Date(),
    } as any);

    // Update PO delivered progress
    for (const line of srn.lines) {
      const poLine = srn.purchaseOrder.lines.find((pl) => pl.id === line.poLineId);
      if (poLine) {
        const newReceived = Number(poLine.receivedQty) + Number(line.deliveredQty);
        const newAccepted = Number(poLine.acceptedQty) + Number(line.acceptedQty);
        await this.prisma.purchaseOrderLine.update({
          where: { id: poLine.id },
          data: {
            receivedQty: newReceived,
            acceptedQty: newAccepted,
            remainingQty: Math.max(0, Number(poLine.orderedQty) - newReceived),
          },
        });
      }
    }

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).SERVICE_RECEIPT_ACCEPTED ?? 'service_receipt.accepted.v1',
        {
          srnId: id,
          acceptedById: actor?.id,
        },
        {
          organizationId: srn.organizationId,
          communityId: srn.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async getServiceReceipt(id: string, organizationId?: string) {
    const srn = await this.srnRepo.findById(id, organizationId);
    if (!srn) throw new NotFoundException('Service Receipt Note not found');
    return srn;
  }
}
