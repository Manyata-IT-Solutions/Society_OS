import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ProjectHandoverService } from './project-handover.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('project-handover')
@UseGuards(AuthGuard)
export class HandoverController {
  constructor(private readonly hndService: ProjectHandoverService) {}

  @Post()
  async initiateHandover(@Body() dto: any, @Request() req: any) {
    return this.hndService.initiateHandover(dto, req.user?.id);
  }

  @Get()
  async getHandovers(@Query('projectId') projectId: string) {
    return this.hndService.getHandovers(projectId);
  }
}
