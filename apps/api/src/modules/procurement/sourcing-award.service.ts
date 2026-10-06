import { Injectable, NotFoundException } from '@nestjs/common';
import { SourcingAwardRepository } from './sourcing-award.repository.js';
import { ProcurementSequenceService } from './sequence.service.js';
import { VendorEligibilityService } from '../vendor/vendor-eligibility.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, SourcingAward } from '@community-os/types';

@Injectable()
export class SourcingAwardService {
  constructor(
    private readonly awardRepo: SourcingAwardRepository,
    private readonly sequenceService: ProcurementSequenceService,
    private readonly vendorEligibility: VendorEligibilityService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async recommendAward(
    data: {
      rfqId: string;
      selectedVendorId?: string | null;
      isSplitAward?: boolean;
      isSingleSource?: boolean;
      isLowestPriceSelected?: boolean;
      recommendationReason: string;
      decisionNotes?: string | null;
      lines: Array<{
        rfqLineId: string;
        quotationId: string;
        quotationLineId: string;
        vendorId: string;
        awardedQuantity: number;
        uomId?: string | null;
        unitPrice: number;
      }>;
    },
    actor: Actor,
  ): Promise<SourcingAward> {
    const rfq = await this.prisma.requestForQuotation.findUnique({
      where: { id: data.rfqId },
    });

    if (!rfq) throw new NotFoundException('RFQ not found');

    const awardNumber = await this.sequenceService.getNextNumber(
      rfq.organizationId,
      rfq.communityId,
      'SOURCING_AWARD',
      'AWD',
    );

    const award = await this.awardRepo.create({
      organization: { connect: { id: rfq.organizationId } },
      community: { connect: { id: rfq.communityId } },
      awardNumber,
      rfq: { connect: { id: rfq.id } },
      selectedVendor: data.selectedVendorId
        ? { connect: { id: data.selectedVendorId } }
        : undefined,
      isSplitAward: Boolean(data.isSplitAward),
      isSingleSource: Boolean(data.isSingleSource),
      isLowestPriceSelected: Boolean(data.isLowestPriceSelected),
      recommendationReason: data.recommendationReason,
      decisionNotes: data.decisionNotes ?? null,
      recommendedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      recommendedAt: new Date(),
      status: 'RECOMMENDED',
      lines: {
        create: data.lines.map((l) => ({
          rfqLineId: l.rfqLineId,
          quotationId: l.quotationId,
          quotationLineId: l.quotationLineId,
          vendorId: l.vendorId,
          awardedQuantity: l.awardedQuantity,
          uomId: l.uomId ?? null,
          unitPrice: l.unitPrice,
          lineTotal: l.awardedQuantity * l.unitPrice,
        })),
      },
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PROCUREMENT_AWARD_RECOMMENDED ?? 'procurement.award_recommended.v1',
        {
          awardNumber: award.awardNumber,
          rfqId: rfq.id,
        },
        {
          organizationId: rfq.organizationId,
          communityId: rfq.communityId,
          userId: actor?.id,
        },
      ),
    );

    return award as unknown as SourcingAward;
  }

  async approveAward(id: string, actor: Actor) {
    const award = await this.awardRepo.findById(id);
    if (!award) throw new NotFoundException('Award not found');

    const updated = await this.awardRepo.update(id, {
      status: 'APPROVED',
      approvedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      approvedAt: new Date(),
    } as any);

    // Mark RFQ status awarded
    await this.prisma.requestForQuotation.update({
      where: { id: award.rfqId },
      data: { status: 'AWARDED' },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).PROCUREMENT_AWARD_APPROVED ?? 'procurement.award_approved.v1',
        {
          awardId: id,
          approvedById: actor?.id,
        },
        {
          organizationId: award.organizationId,
          communityId: award.communityId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async getAward(id: string) {
    const award = await this.awardRepo.findById(id);
    if (!award) throw new NotFoundException('Award not found');
    return award;
  }
}
