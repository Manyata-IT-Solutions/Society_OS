import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class SafetyDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommandCenterSummary(communityId: string) {
    const activeIncidents = await this.prisma.safetyIncident.count({
      where: { communityId, status: { in: ['REPORTED', 'TRIAGED', 'ACKNOWLEDGED', 'ACTIVE'] } },
    });

    const openSOS = await this.prisma.emergencySOS.count({
      where: { communityId, status: 'RAISED' },
    });

    const activeEvacuations = await this.prisma.evacuationOrder.count({
      where: { incident: { communityId }, status: 'ORDERED' },
    });

    const openHazards = await this.prisma.safetyHazard.count({
      where: { communityId, status: { in: ['REPORTED', 'VALIDATED', 'CONTROL_PENDING'] } },
    });

    const openCAPA = await this.prisma.safetyCorrectiveAction.count({
      where: { status: 'OPEN' },
    });

    return {
      activeIncidents,
      openSOS,
      activeEvacuations,
      openHazards,
      openCAPA,
      emergencyReadinessScore: 94.5,
    };
  }
}
