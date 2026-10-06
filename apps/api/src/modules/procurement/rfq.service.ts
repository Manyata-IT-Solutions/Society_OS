import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RfqRepository } from './rfq.repository.js';
import { ProcurementSequenceService } from './sequence.service.js';
import { VendorEligibilityService } from '../vendor/vendor-eligibility.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, RequestForQuotation } from '@community-os/types';

@Injectable()
export class RfqService {
  constructor(
    private readonly rfqRepo: RfqRepository,
    private readonly sequenceService: ProcurementSequenceService,
    private readonly vendorEligibility: VendorEligibilityService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createRfq(
    data: {
      organizationId: string;
      communityId: string;
      title: string;
      description?: string | null;
      currency?: string;
      submissionDeadline: string;
      commercialTerms?: string | null;
      deliveryTerms?: string | null;
      deliveryLocation?: string | null;
      deliveryRequiredBy?: string | null;
      isSingleSourceAllowed?: boolean;
      singleSourceJustification?: string | null;
      isEmergency?: boolean;
      emergencyJustification?: string | null;
      minimumQuotationsRequired?: number;
      isSealedBid?: boolean;
      vendorIds: string[];
      lines: Array<{
        sourcePrLineId?: string | null;
        lineType?: any;
        inventoryItemId?: string | null;
        description: string;
        specification?: string | null;
        quantity: number;
        uomId?: string | null;
        uomName?: string | null;
        targetDeliveryDate?: string | null;
        deliveryLocation?: string | null;
        technicalRequirements?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<RequestForQuotation> {
    if (!data.vendorIds || data.vendorIds.length === 0) {
      throw new BadRequestException('RFQ must invite at least one vendor');
    }

    if (!data.isSingleSourceAllowed && data.vendorIds.length < 2) {
      throw new BadRequestException(
        'Competitive RFQ must invite multiple vendors unless single source exception is approved',
      );
    }

    // Verify vendor eligibility for each invited vendor
    for (const vendorId of data.vendorIds) {
      const eligibility = await this.vendorEligibility.checkEligibility({
        vendorId,
        organizationId: data.organizationId,
        communityId: data.communityId,
      });
      if (!eligibility.isEligible && !data.isEmergency) {
        throw new BadRequestException(
          `Invited vendor ${eligibility.vendorName} is ineligible: ${eligibility.reasons.join(', ')}`,
        );
      }
    }

    const rfqNumber = await this.sequenceService.getNextNumber(
      data.organizationId,
      data.communityId,
      'RFQ',
      'RFQ',
    );

    const rfq = await this.rfqRepo.create({
      organization: { connect: { id: data.organizationId } },
      community: { connect: { id: data.communityId } },
      rfqNumber,
      title: data.title,
      description: data.description ?? null,
      currency: data.currency ?? 'INR',
      submissionDeadline: new Date(data.submissionDeadline),
      commercialTerms: data.commercialTerms ?? null,
      deliveryTerms: data.deliveryTerms ?? null,
      deliveryLocation: data.deliveryLocation ?? null,
      deliveryRequiredBy: data.deliveryRequiredBy ? new Date(data.deliveryRequiredBy) : null,
      isSingleSourceAllowed: Boolean(data.isSingleSourceAllowed),
      singleSourceJustification: data.singleSourceJustification ?? null,
      isEmergency: Boolean(data.isEmergency),
      emergencyJustification: data.emergencyJustification ?? null,
      minimumQuotationsRequired: data.minimumQuotationsRequired ?? 3,
      isSealedBid: Boolean(data.isSealedBid),
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      lines: {
        create: data.lines.map((l, idx) => ({
          lineNumber: idx + 1,
          sourcePrLineId: l.sourcePrLineId ?? null,
          lineType: l.lineType ?? 'CATALOG_ITEM',
          inventoryItemId: l.inventoryItemId ?? null,
          description: l.description,
          specification: l.specification ?? null,
          quantity: l.quantity,
          uomId: l.uomId ?? null,
          uomName: l.uomName ?? null,
          targetDeliveryDate: l.targetDeliveryDate ? new Date(l.targetDeliveryDate) : null,
          deliveryLocation: l.deliveryLocation ?? null,
          technicalRequirements: l.technicalRequirements ?? null,
        })),
      },
      invitations: {
        create: data.vendorIds.map((vendorId) => ({
          vendorId,
          invitedById: actor?.id ?? null,
          status: 'INVITED',
        })),
      },
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).RFQ_PUBLISHED ?? 'rfq.published.v1',
        {
          rfqNumber: rfq.rfqNumber,
          title: rfq.title,
          deadline: rfq.submissionDeadline,
        },
        {
          organizationId: data.organizationId,
          communityId: data.communityId,
          userId: actor?.id,
        },
      ),
    );

    return rfq as unknown as RequestForQuotation;
  }

  async extendDeadline(
    id: string,
    organizationId: string,
    newDeadline: Date,
    reason: string,
    actor: Actor,
  ) {
    const rfq = await this.rfqRepo.findById(id, organizationId);
    if (!rfq) throw new NotFoundException('RFQ not found');

    const updated = await this.rfqRepo.update(id, organizationId, {
      submissionDeadline: newDeadline,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).RFQ_DEADLINE_EXTENDED ?? 'rfq.deadline_extended.v1',
        {
          rfqId: id,
          newDeadline,
          reason,
        },
        {
          organizationId,
          communityId: rfq.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async closeRfq(id: string, organizationId: string, actor: Actor) {
    const rfq = await this.rfqRepo.findById(id, organizationId);
    if (!rfq) throw new NotFoundException('RFQ not found');

    const updated = await this.rfqRepo.update(id, organizationId, {
      status: 'CLOSED',
      closedAt: new Date(),
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).RFQ_CLOSED ?? 'rfq.closed.v1',
        {
          rfqId: id,
        },
        {
          organizationId,
          communityId: rfq.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async getRfq(id: string, organizationId?: string) {
    const rfq = await this.rfqRepo.findById(id, organizationId);
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async listRfqs(params: {
    organizationId: string;
    communityId?: string;
    status?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return this.rfqRepo.findMany(params);
  }
}
