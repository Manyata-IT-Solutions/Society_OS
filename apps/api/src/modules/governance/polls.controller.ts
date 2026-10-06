import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernancePollService } from './governance-poll.service.js';
import { CreateGovernancePollDto, RespondGovernancePollDto } from '@community-os/contracts';

@Controller('governance/polls')
@UseGuards(AuthGuard)
export class GovernancePollsController {
  constructor(private readonly pollService: GovernancePollService) {}

  @Post()
  async createPoll(@Body() dto: CreateGovernancePollDto) {
    return this.pollService.createPoll(dto);
  }

  @Post('respond')
  async submitResponse(@Body() dto: RespondGovernancePollDto) {
    return this.pollService.submitResponse(dto);
  }

  @Get()
  async listPolls(@Query('communityId') communityId: string) {
    return this.pollService.listPolls(communityId);
  }
}
