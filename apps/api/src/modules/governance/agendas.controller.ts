import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { MeetingAgendaService } from './meeting-agenda.service.js';
import { CreateMeetingAgendaDto } from '@community-os/contracts';

@Controller('governance/agendas')
@UseGuards(AuthGuard)
export class GovernanceAgendasController {
  constructor(private readonly agendaService: MeetingAgendaService) {}

  @Post()
  async createOrVersionAgenda(@Body() dto: CreateMeetingAgendaDto, @Req() req: any) {
    return this.agendaService.createOrVersionAgenda(dto, req.user?.id);
  }

  @Get('meeting/:meetingId')
  async getLatestAgenda(@Param('meetingId') meetingId: string) {
    return this.agendaService.getLatestAgenda(meetingId);
  }
}
