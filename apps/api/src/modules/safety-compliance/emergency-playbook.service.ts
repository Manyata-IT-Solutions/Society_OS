import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateEmergencyPlaybookDto } from '@community-os/contracts';

@Injectable()
export class EmergencyPlaybookService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlaybook(dto: CreateEmergencyPlaybookDto) {
    return this.prisma.emergencyPlaybook.create({
      data: {
        communityId: dto.communityId,
        incidentType: dto.incidentType as any,
        title: dto.title,
        stepsPayload: dto.stepsPayload as any,
        contactsPayload: dto.contactsPayload as any,
        recommendedSeverity: dto.recommendedSeverity as any,
        status: 'ACTIVE',
      },
    });
  }

  async getPlaybookForType(communityId: string, incidentType: string) {
    return this.prisma.emergencyPlaybook.findFirst({
      where: { communityId, incidentType, status: 'ACTIVE' },
      orderBy: { versionNumber: 'desc' },
    });
  }
}
