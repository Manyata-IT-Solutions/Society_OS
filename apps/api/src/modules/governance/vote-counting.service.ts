import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class VoteCountingService {
  constructor(private readonly prisma: PrismaService) {}

  async countAndPublishResult(voteId: string) {
    const vote = await this.prisma.governanceVote.findUnique({
      where: { id: voteId },
      include: {
        ballots: { include: { entitlement: true } },
        entitlements: true,
      },
    });
    if (!vote) {
      throw new NotFoundException(`Vote with ID ${voteId} not found`);
    }

    let yesWeight = 0;
    let noWeight = 0;
    let abstainWeight = 0;

    for (const b of vote.ballots) {
      const weight = Number(b.entitlement.weight || 1.0);
      if (b.selectedOption === 'YES') yesWeight += weight;
      else if (b.selectedOption === 'NO') noWeight += weight;
      else if (b.selectedOption === 'ABSTAIN') abstainWeight += weight;
    }

    const totalVotesCast = vote.ballots.length;
    const totalWeightCast = yesWeight + noWeight + abstainWeight;
    const thresholdPct = Number(vote.thresholdPercentage || 50.0);

    const votingBase = yesWeight + noWeight;
    const passed = votingBase > 0 && (yesWeight / votingBase) * 100 > thresholdPct;
    const resultStatus = passed ? 'PASSED' : 'FAILED';

    const resultSummary = {
      yesWeight,
      noWeight,
      abstainWeight,
      totalVotesCast,
      totalWeightCast,
      totalEligibleEntitlements: vote.entitlements.length,
      thresholdPercentage: thresholdPct,
      passed,
    };

    const updated = await this.prisma.governanceVote.update({
      where: { id: voteId },
      data: {
        status: 'RESULT_PUBLISHED',
        closesAt: vote.closesAt || new Date(),
        resultPublishedAt: new Date(),
        resultStatus,
        resultSummary,
      },
    });

    return updated;
  }
}
