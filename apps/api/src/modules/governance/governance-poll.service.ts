import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateGovernancePollDto, RespondGovernancePollDto } from '@community-os/contracts';

@Injectable()
export class GovernancePollService {
  constructor(private readonly prisma: PrismaService) {}

  async createPoll(dto: CreateGovernancePollDto) {
    return this.prisma.governancePoll.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        title: dto.title,
        description: dto.description,
        pollType: dto.pollType || 'SINGLE_CHOICE',
        targetAudienceType: dto.targetAudienceType || 'ALL_RESIDENTS',
        optionsPayload: dto.options,
        status: 'OPEN',
        opensAt: dto.opensAt ? new Date(dto.opensAt) : new Date(),
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
      },
    });
  }

  async submitResponse(dto: RespondGovernancePollDto) {
    const existing = await this.prisma.governancePollResponse.findUnique({
      where: {
        pollId_residentId: {
          pollId: dto.pollId,
          residentId: dto.residentId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Resident has already submitted a response to this poll');
    }

    return this.prisma.governancePollResponse.create({
      data: {
        pollId: dto.pollId,
        residentId: dto.residentId,
        selectedOptions: dto.selectedOptions,
      },
    });
  }

  async listPolls(communityId: string) {
    return this.prisma.governancePoll.findMany({
      where: { communityId },
      include: { responses: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
