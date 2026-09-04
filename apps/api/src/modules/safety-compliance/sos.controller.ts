import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { EmergencySOSService } from './emergency-sos.service.js';
import { RaiseEmergencySOSDto, AcknowledgeSOSDto } from '@community-os/contracts';

@Controller('safety/sos')
@UseGuards(AuthGuard)
export class EmergencySOSController {
  constructor(private readonly sosService: EmergencySOSService) {}

  @Post('raise')
  async raiseSOS(@Body() dto: RaiseEmergencySOSDto) {
    return this.sosService.raiseSOS(dto);
  }

  @Post('acknowledge')
  async acknowledgeSOS(@Body() dto: AcknowledgeSOSDto, @Req() req: any) {
    return this.sosService.acknowledgeSOS(dto, req?.user?.id);
  }

  @Get()
  async listSOS(@Query('communityId') communityId: string) {
    return this.sosService.listSOSAlerts(communityId);
  }
}
