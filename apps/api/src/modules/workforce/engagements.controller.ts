import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkerEngagementService } from './worker-engagement.service.js';
import { CreateEngagementDto } from '@community-os/contracts';

@Controller('workforce/engagements')
@UseGuards(AuthGuard)
export class EngagementsController {
  constructor(private readonly engagementService: WorkerEngagementService) {}

  @Post()
  async createEngagement(@Body() dto: CreateEngagementDto) {
    return this.engagementService.createEngagement(dto);
  }

  @Get(':workerId')
  async getEngagements(@Param('workerId') workerId: string) {
    return this.engagementService.getEngagements(workerId);
  }
}
