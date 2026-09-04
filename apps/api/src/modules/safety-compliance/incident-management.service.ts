import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SafetySequenceService } from './safety-sequence.service.js';
import {
  CreateSafetyIncidentDto,
  TriageIncidentDto,
  UpdateIncidentStatusDto,
} from '@community-os/contracts';

@Injectable()
export class IncidentManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SafetySequenceService,
  ) {}

  async createIncident(dto: CreateSafetyIncidentDto, actorId?: string) {
    const incidentNumber =
      dto.incidentNumber || (await this.sequence.getNextIncidentNumber(dto.communityId));

    const incident = await this.prisma.safetyIncident.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        incidentNumber,
        title: dto.title,
        description: dto.description,
        incidentType: dto.incidentType as any,
        severity: dto.severity as any,
        priority: (dto.priority as any) || 'HIGH',
        status: 'REPORTED',
        sourceType: (dto.sourceType as any) || 'MANUAL',
        sourceReferenceId: dto.sourceReferenceId,
        buildingId: dto.buildingId,
        floorId: dto.floorId,
        unitId: dto.unitId,
        assetId: dto.assetId,
        locationDetails: dto.locationDetails,
      },
      include: { building: true, unit: true, asset: true },
    });

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: incident.id,
        entryType: 'INCIDENT_CREATED',
        title: `Incident ${incidentNumber} reported`,
        description: dto.title,
        actorId,
      },
    });

    return incident;
  }

  async triageIncident(dto: TriageIncidentDto, actorId?: string) {
    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id: dto.incidentId },
    });
    if (!incident) throw new NotFoundException('Safety Incident not found');

    const updated = await this.prisma.safetyIncident.update({
      where: { id: dto.incidentId },
      data: {
        incidentType: dto.incidentType ? (dto.incidentType as any) : undefined,
        severity: dto.severity ? (dto.severity as any) : undefined,
        priority: dto.priority ? (dto.priority as any) : undefined,
        status: 'TRIAGED',
      },
    });

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: incident.id,
        entryType: 'TRIAGED',
        title: `Incident triaged to ${updated.severity} (Priority: ${updated.priority})`,
        description: dto.triageNotes,
        actorId,
      },
    });

    return updated;
  }

  async updateStatus(dto: UpdateIncidentStatusDto, actorId?: string) {
    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id: dto.incidentId },
    });
    if (!incident) throw new NotFoundException('Safety Incident not found');

    const updateData: any = { status: dto.status };
    if (dto.status === 'CONTAINED') updateData.containedAt = new Date();
    if (dto.status === 'RESOLVED') updateData.resolvedAt = new Date();
    if (dto.status === 'CLOSED') updateData.closedAt = new Date();

    const updated = await this.prisma.safetyIncident.update({
      where: { id: dto.incidentId },
      data: updateData,
    });

    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId: incident.id,
        entryType:
          dto.status === 'CONTAINED'
            ? 'CONTAINED'
            : dto.status === 'RESOLVED'
              ? 'RESOLVED'
              : dto.status === 'CLOSED'
                ? 'CLOSED'
                : 'NOTE',
        title: `Status changed to ${dto.status}`,
        description: dto.notes,
        actorId,
      },
    });

    return updated;
  }

  async getIncidentById(id: string) {
    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id },
      include: {
        command: { include: { commander: true } },
        responders: { include: { worker: true } },
        timelineEntries: { orderBy: { occurredAt: 'asc' } },
        actions: true,
        evacuationOrders: { include: { evacuationPlan: true, musterSessions: true } },
        investigation: { include: { leadInvestigator: true } },
        evidenceLinks: { include: { document: true } },
        building: true,
        unit: true,
        asset: true,
      },
    });
    if (!incident) throw new NotFoundException('Safety Incident not found');
    return incident;
  }

  async listIncidents(communityId: string, status?: string) {
    const where: any = { communityId };
    if (status) where.status = status;

    return this.prisma.safetyIncident.findMany({
      where,
      include: {
        command: { include: { commander: true } },
        responders: true,
        building: true,
        unit: true,
      },
      orderBy: { reportedAt: 'desc' },
    });
  }
}
