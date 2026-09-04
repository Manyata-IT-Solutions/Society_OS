import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { EmergencyPlaybookService } from './emergency-playbook.service.js';
import { CreateEmergencyPlaybookDto } from '@community-os/contracts';

@Controller('safety/playbooks')
@UseGuards(AuthGuard)
export class EmergencyPlaybooksController {
  constructor(private readonly playbookService: EmergencyPlaybookService) {}

  @Post()
  async createPlaybook(@Body() dto: CreateEmergencyPlaybookDto) {
    return this.playbookService.createPlaybook(dto);
  }

  @Get(':incidentType')
  async getPlaybook(
    @Query('communityId') communityId: string,
    @Param('incidentType') incidentType: string,
  ) {
    return this.playbookService.getPlaybookForType(communityId, incidentType);
  }
}
