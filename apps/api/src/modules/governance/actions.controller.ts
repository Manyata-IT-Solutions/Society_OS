import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernanceActionItemService } from './governance-action-item.service.js';
import { CreateGovernanceActionItemDto } from '@community-os/contracts';

@Controller('governance/actions')
@UseGuards(AuthGuard)
export class GovernanceActionsController {
  constructor(private readonly actionService: GovernanceActionItemService) {}

  @Post()
  async createActionItem(@Body() dto: CreateGovernanceActionItemDto) {
    return this.actionService.createActionItem(dto);
  }

  @Post(':id/complete')
  async completeActionItem(@Param('id') id: string) {
    return this.actionService.completeActionItem(id);
  }

  @Get()
  async listActionItems(
    @Query('communityId') communityId: string,
    @Query('status') status?: string,
  ) {
    return this.actionService.listActionItems(communityId, status);
  }
}
