import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateEvacuationPlanDto, OrderEvacuationDto } from '@community-os/contracts';

@Injectable()
export class EvacuationService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlan(dto: CreateEvacuationPlanDto) {
    return this.prisma.evacuationPlan.create({
      data: {
        communityId: dto.communityId,
        name: dto.name,
        scope: dto.scope,
        status: 'ACTIVE',
        zones: {
          create: dto.zones.map((z) => ({
            name: z.name,
            buildingId: z.buildingId,
            instructions: z.instructions,
          })),
        },
        musterPoints: {
          create: dto.musterPoints.map((m) => ({
            name: m.name,
            locationDescription: m.locationDescription,
            capacity: m.capacity,
          })),
        },
      },
      include: { zones: true, musterPoints: true },
    });
  }

  async orderEvacuation(dto: OrderEvacuationDto, actorId?: string) {
    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id: dto.incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const order = await this.prisma.evacuationOrder.create({
      data: {
        incidentId: dto.incidentId,
        evacuationPlanId: dto.evacuationPlanId,
        scope: dto.scope,
        reason: dto.reason,
        priority: dto.priority || 'CRITICAL',
        status: 'ORDERED',
        orderedById: actorId,
      },
      include: { evacuationPlan: { include: { musterPoints: true } } },
    });

    // Create corresponding Muster Session
    const session = await this.prisma.musterSession.create({
      data: {
        incidentId: dto.incidentId,
        evacuationOrderId: order.id,
        status: 'IN_PROGRESS',
      },
    });

    // Take snapshot of potential residents
    const units = await this.prisma.unit.findMany({
      where: { building: { section: { communityId: incident.communityId } } },
      take: 10,
    });

    for (const u of units) {
      await this.prisma.musterEntry.create({
        data: {
          sessionId: session.id,
          subjectType: 'RESIDENT',
          subjectId: u.id,
          unitId: u.id,
          accountabilityStatus: 'NOT_CHECKED',
        },
      });
    }

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: dto.incidentId,
        entryType: 'EVACUATION_ORDERED',
        title: `Evacuation ordered: ${dto.scope}`,
        description: dto.reason,
        actorId,
      },
    });

    return { order, session };
  }
}
