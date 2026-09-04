import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { GovernanceSequenceService } from './governance-sequence.service.js';
import { AdoptResolutionDto } from '@community-os/contracts';

@Injectable()
export class GovernanceResolutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: GovernanceSequenceService,
  ) {}

  async adoptResolution(dto: AdoptResolutionDto) {
    const resolutionNumber = await this.sequence.getNextResolutionNumber(dto.communityId);

    const resolution = await this.prisma.governanceResolution.create({
      data: {
        communityId: dto.communityId,
        meetingId: dto.meetingId,
        agendaItemId: dto.agendaItemId,
        motionId: dto.motionId,
        voteId: dto.voteId,
        resolutionNumber,
        title: dto.title,
        resolutionText: dto.resolutionText,
        decisionDate: new Date(),
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        status: 'ADOPTED',
        classification: dto.classification || 'GENERAL',
        linkedDomainType: dto.linkedDomainType,
        linkedDomainId: dto.linkedDomainId,
      },
    });

    return resolution;
  }

  async listResolutions(communityId: string, classification?: string) {
    const where: any = { communityId };
    if (classification) where.classification = classification;

    return this.prisma.governanceResolution.findMany({
      where,
      include: {
        meeting: true,
        actionItems: true,
      },
      orderBy: { decisionDate: 'desc' },
    });
  }
}
