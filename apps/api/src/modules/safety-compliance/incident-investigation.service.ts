import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateIncidentInvestigationDto } from '@community-os/contracts';

@Injectable()
export class IncidentInvestigationService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvestigation(dto: CreateIncidentInvestigationDto) {
    return this.prisma.incidentInvestigation.create({
      data: {
        incidentId: dto.incidentId,
        leadInvestigatorId: dto.leadInvestigatorId,
        methodology: dto.methodology || '5_WHYS',
        immediateCause: dto.immediateCause,
        rootCause: dto.rootCause,
        contributingFactors: dto.contributingFactors as any,
        recommendations: dto.recommendations,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async recordLessonLearned(incidentId: string, category: string, lesson: string, change: string) {
    return this.prisma.incidentLesson.create({
      data: {
        incidentId,
        category,
        lesson,
        recommendedChange: change,
      },
    });
  }
}
