import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateVoteDto, CastVoteBallotDto } from '@community-os/contracts';

@Injectable()
export class GovernanceVoteService {
  constructor(private readonly prisma: PrismaService) {}

  async createVote(dto: CreateVoteDto) {
    const count = await this.prisma.governanceVote.count({
      where: { meetingId: dto.meetingId },
    });
    const voteNumber = `VOTE-${String(count + 1).padStart(3, '0')}`;

    const vote = await this.prisma.governanceVote.create({
      data: {
        meetingId: dto.meetingId,
        motionId: dto.motionId,
        voteNumber,
        title: dto.title,
        description: dto.description,
        voteType: dto.voteType || 'FORMAL_MOTION',
        votingMethod: dto.votingMethod || 'DIGITAL',
        thresholdType: dto.thresholdType || 'SIMPLE_MAJORITY',
        thresholdPercentage: dto.thresholdPercentage || 50.0,
        status: 'OPEN',
        opensAt: dto.opensAt ? new Date(dto.opensAt) : new Date(),
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
      },
    });

    return vote;
  }

  async issueEntitlement(voteId: string, residentId: string, weight = 1.0) {
    return this.prisma.voteEntitlement.create({
      data: {
        voteId,
        residentId,
        weight,
        channelStatus: 'DIGITAL_ELIGIBLE',
        isConsumed: false,
      },
    });
  }

  async castBallot(dto: CastVoteBallotDto) {
    return this.prisma.$transaction(async (tx: any) => {
      const vote = await tx.governanceVote.findUnique({
        where: { id: dto.voteId },
      });
      if (!vote || vote.status !== 'OPEN') {
        throw new BadRequestException('Voting session is not currently open');
      }

      const entitlement = await tx.voteEntitlement.findUnique({
        where: { id: dto.entitlementId },
      });
      if (!entitlement || entitlement.voteId !== dto.voteId) {
        throw new NotFoundException('Valid vote entitlement not found');
      }
      if (entitlement.isConsumed) {
        throw new ConflictException(
          'Vote entitlement has already been consumed (double-vote prevented)',
        );
      }

      // Mark entitlement consumed
      await tx.voteEntitlement.update({
        where: { id: dto.entitlementId },
        data: {
          isConsumed: true,
          consumedAt: new Date(),
        },
      });

      const ballot = await tx.voteBallot.create({
        data: {
          voteId: dto.voteId,
          entitlementId: dto.entitlementId,
          selectedOption: dto.selectedOption,
          signatureHash: dto.signatureHash,
        },
      });

      return ballot;
    });
  }
}
