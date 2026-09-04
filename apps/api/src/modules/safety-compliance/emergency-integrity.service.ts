import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class EmergencyIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async runIntegrityAudit(communityId: string) {
    const expiredActiveCredentials = await this.prisma.complianceCredential.findMany({
      where: { communityId, expiryDate: { lt: new Date() }, status: 'ACTIVE' },
    });

    const unassignedIncidents = await this.prisma.safetyIncident.findMany({
      where: { communityId, status: 'ACTIVE', command: null },
    });

    return {
      communityId,
      expiredActiveCredentialsCount: expiredActiveCredentials.length,
      unassignedActiveIncidentsCount: unassignedIncidents.length,
      auditTimestamp: new Date().toISOString(),
    };
  }
}
