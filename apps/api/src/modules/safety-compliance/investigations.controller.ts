import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { IncidentInvestigationService } from './incident-investigation.service.js';
import { CreateIncidentInvestigationDto } from '@community-os/contracts';

@Controller('safety/investigations')
@UseGuards(AuthGuard)
export class IncidentInvestigationsController {
  constructor(private readonly invService: IncidentInvestigationService) {}

  @Post()
  async createInvestigation(@Body() dto: CreateIncidentInvestigationDto) {
    return this.invService.createInvestigation(dto);
  }
}
