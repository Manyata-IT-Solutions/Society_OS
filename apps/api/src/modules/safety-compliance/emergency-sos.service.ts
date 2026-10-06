import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SafetySequenceService } from './safety-sequence.service.js';
import { RaiseEmergencySOSDto, AcknowledgeSOSDto } from '@community-os/contracts';

@Injectable()
export class EmergencySOSService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SafetySequenceService,
  ) {}

  async raiseSOS(dto: RaiseEmergencySOSDto) {
    // Check for recent duplicate SOS from same initiator/unit within 60 seconds (Idempotent retry protection)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const existing = await this.prisma.emergencySOS.findFirst({
      where: {
        communityId: dto.communityId,
        sosType: dto.sosType,
        initiatorId: dto.initiatorId,
        raisedAt: { gte: oneMinuteAgo },
        status: 'RAISED',
      },
    });

    if (existing) {
      return { isDuplicate: true, sos: existing };
    }

    const sosNumber = await this.sequence.getNextSOSNumber(dto.communityId);

    const sos = await this.prisma.emergencySOS.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        sosNumber,
        initiatorType: dto.initiatorType || 'RESIDENT',
        initiatorId: dto.initiatorId,
        unitId: dto.unitId,
        sosType: dto.sosType,
        locationDetails: dto.locationDetails,
        message: dto.message,
        status: 'RAISED',
      },
      include: { unit: true },
    });

    return { isDuplicate: false, sos };
  }

  async acknowledgeSOS(dto: AcknowledgeSOSDto, actorId?: string) {
    const sos = await this.prisma.emergencySOS.findUnique({
      where: { id: dto.sosId },
    });
    if (!sos) throw new NotFoundException('Emergency SOS alert not found');

    let createdIncidentId = sos.incidentId;

    if (dto.createIncident && !sos.incidentId) {
      const incNumber = await this.sequence.getNextIncidentNumber(sos.communityId);
      const inc = await this.prisma.safetyIncident.create({
        data: {
          organizationId: sos.organizationId,
          communityId: sos.communityId,
          incidentNumber: incNumber,
          title: `Emergency Response for SOS ${sos.sosNumber} (${sos.sosType})`,
          description: sos.message || `Automated incident created from SOS alert ${sos.sosNumber}`,
          incidentType: (dto.incidentType as any) || sos.sosType || 'OTHER',
          severity: (dto.severity as any) || 'SEV_1_CRITICAL',
          priority: 'URGENT',
          status: 'ACTIVE',
          sourceType: 'SOS',
          sourceReferenceId: sos.id,
          unitId: sos.unitId,
          locationDetails: sos.locationDetails,
        },
      });

      createdIncidentId = inc.id;

      // Add timeline entry
      await this.prisma.incidentTimelineEntry.create({
        data: {
          incidentId: inc.id,
          entryType: 'SOS_RECEIVED',
          title: `Incident created from SOS alert ${sos.sosNumber}`,
          description: dto.resolutionNotes,
          actorId,
        },
      });
    }

    const updated = await this.prisma.emergencySOS.update({
      where: { id: dto.sosId },
      data: {
        status: createdIncidentId ? 'INCIDENT_CREATED' : 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        incidentId: createdIncidentId,
      },
      include: { incident: true },
    });

    return updated;
  }

  async listSOSAlerts(communityId: string) {
    return this.prisma.emergencySOS.findMany({
      where: { communityId },
      include: { unit: true, incident: true },
      orderBy: { raisedAt: 'desc' },
    });
  }
}
