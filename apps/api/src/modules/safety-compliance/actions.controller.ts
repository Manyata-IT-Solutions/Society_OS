import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { IncidentActionService } from './incident-action.service.js';
import { CreateIncidentActionDto, CompleteIncidentActionDto } from '@community-os/contracts';

@Controller('safety/actions')
@UseGuards(AuthGuard)
export class IncidentActionsController {
  constructor(private readonly actionService: IncidentActionService) {}

  @Post()
  async createAction(@Body() dto: CreateIncidentActionDto, @Req() req: any) {
    return this.actionService.createAction(dto, req?.user?.id);
  }

  @Post('complete')
  async completeAction(@Body() dto: CompleteIncidentActionDto, @Req() req: any) {
    return this.actionService.completeAction(dto, req?.user?.id);
  }
}
