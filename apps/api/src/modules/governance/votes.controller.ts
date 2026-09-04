import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernanceVoteService } from './governance-vote.service.js';
import { VoteCountingService } from './vote-counting.service.js';
import { CreateVoteDto, CastVoteBallotDto } from '@community-os/contracts';

@Controller('governance/votes')
@UseGuards(AuthGuard)
export class GovernanceVotesController {
  constructor(
    private readonly voteService: GovernanceVoteService,
    private readonly countingService: VoteCountingService,
  ) {}

  @Post()
  async createVote(@Body() dto: CreateVoteDto) {
    return this.voteService.createVote(dto);
  }

  @Post(':id/entitlements')
  async issueEntitlement(
    @Param('id') id: string,
    @Body('residentId') residentId: string,
    @Body('weight') weight?: number,
  ) {
    return this.voteService.issueEntitlement(id, residentId, weight);
  }

  @Post('cast')
  async castBallot(@Body() dto: CastVoteBallotDto) {
    return this.voteService.castBallot(dto);
  }

  @Post(':id/count')
  async countResult(@Param('id') id: string) {
    return this.countingService.countAndPublishResult(id);
  }
}
