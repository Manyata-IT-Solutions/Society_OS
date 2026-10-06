import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateIncidentActionDto, CompleteIncidentActionDto } from '@community-os/contracts';

@Injectable()
export class IncidentActionService {
  constructor(private readonly prisma: PrismaService) {}

  async createAction(dto: CreateIncidentActionDto, actorId?: string) {
    const action = await this.prisma.incidentAction.create({
      data: {
        incidentId: dto.incidentId,
        title: dto.title,
        description: dto.description,
        ownerId: dto.ownerId,
        priority: (dto.priority as any) || 'HIGH',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        status: 'OPEN',
      },
    });

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: dto.incidentId,
        entryType: 'ACTION_CREATED',
        title: `Action item created: ${dto.title}`,
        description: dto.description,
        actorId,
      },
    });

    return action;
  }

  async completeAction(dto: CompleteIncidentActionDto, actorId?: string) {
    const action = await this.prisma.incidentAction.findUnique({
      where: { id: dto.actionId },
    });
    if (!action) throw new NotFoundException('Incident action not found');

    const updated = await this.prisma.incidentAction.update({
      where: { id: dto.actionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNotes: dto.completionNotes,
      },
    });

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: action.incidentId,
        entryType: 'NOTE',
        title: `Action completed: ${action.title}`,
        description: dto.completionNotes,
        actorId,
      },
    });

    return updated;
  }
}
