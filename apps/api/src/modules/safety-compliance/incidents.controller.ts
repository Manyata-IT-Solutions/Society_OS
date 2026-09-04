import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { IncidentManagementService } from './incident-management.service.js';
import {
  CreateSafetyIncidentDto,
  TriageIncidentDto,
  UpdateIncidentStatusDto,
} from '@community-os/contracts';

@Controller('safety/incidents')
@UseGuards(AuthGuard)
export class SafetyIncidentsController {
  constructor(private readonly incidentService: IncidentManagementService) {}

  @Post()
  async createIncident(@Body() dto: CreateSafetyIncidentDto, @Req() req: any) {
    return this.incidentService.createIncident(dto, req?.user?.id);
  }

  @Post('triage')
  async triageIncident(@Body() dto: TriageIncidentDto, @Req() req: any) {
    return this.incidentService.triageIncident(dto, req?.user?.id);
  }

  @Post('status')
  async updateStatus(@Body() dto: UpdateIncidentStatusDto, @Req() req: any) {
    return this.incidentService.updateStatus(dto, req?.user?.id);
  }

  @Get(':id')
  async getIncidentById(@Param('id') id: string) {
    return this.incidentService.getIncidentById(id);
  }

  @Get()
  async listIncidents(@Query('communityId') communityId: string, @Query('status') status?: string) {
    return this.incidentService.listIncidents(communityId, status);
  }
}
