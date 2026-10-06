function isValidUuid(id?: string | null): boolean {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { BudgetSequenceService } from './budget-sequence.service.js';
import { CapexInitiative } from '@prisma/client';
import { EventsService } from '../events/events.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';

@Injectable()
export class CapexPlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: BudgetSequenceService,
    private readonly eventsService: EventsService,
  ) {}

  async createInitiative(data: any, actor?: any): Promise<CapexInitiative> {
    const code =
      data.code || (await this.sequenceService.getNextNumber(data.organizationId, 'CAPEX'));
    const userId = actor?.userId || actor?.id;

    const initiative = await this.prisma.capexInitiative.create({
      data: {
        organization: { connect: { id: data.organizationId } },
        community: { connect: { id: data.communityId } },
        code,
        name: data.name,
        description: data.description,
        category: data.category || 'OTHER',
        priority: data.priority || 'MEDIUM',
        businessJustification: data.businessJustification,
        estimatedCost: data.estimatedCost,
        approvedBudget: data.approvedBudget || data.estimatedCost,
        committedCost: data.committedCost || 0,
        actualCost: data.actualCost || 0,
        forecastCost: data.forecastCost || data.estimatedCost,
        physicalProgressPercent: data.physicalProgressPercent || 0,
        plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
        plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : undefined,
        status: data.status || 'PROPOSED',
        sponsor: data.sponsor,
        fund: data.fundId ? { connect: { id: data.fundId } } : undefined,
        costCenter: data.costCenterId ? { connect: { id: data.costCenterId } } : undefined,
        document: data.documentId ? { connect: { id: data.documentId } } : undefined,
        createdById: isValidUuid(userId) ? userId : undefined,
      },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).BUDGET_CAPEX_APPROVED ?? 'budget.capex_approved.v1',
        { capexId: initiative.id, code },
        { organizationId: data.organizationId, userId },
      ),
    );

    return initiative;
  }

  async listInitiatives(communityId: string): Promise<CapexInitiative[]> {
    return this.prisma.capexInitiative.findMany({
      where: { communityId },
      include: { fund: true, costCenter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProgress(
    id: string,
    progressPercent: number,
    forecastCost?: number,
  ): Promise<CapexInitiative> {
    const data: any = { physicalProgressPercent: progressPercent };
    if (forecastCost !== undefined) data.forecastCost = forecastCost;

    return this.prisma.capexInitiative.update({
      where: { id },
      data,
    });
  }
}
