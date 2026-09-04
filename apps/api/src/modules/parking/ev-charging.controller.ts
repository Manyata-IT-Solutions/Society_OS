import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { EVChargingService } from './ev-charging.service.js';
import { RecordEVChargingSessionDto } from '@community-os/contracts';

@Controller('parking/ev-charging')
@UseGuards(AuthGuard)
export class EVChargingController {
  constructor(private readonly evService: EVChargingService) {}

  @Post('sessions')
  async recordSession(@Body() dto: RecordEVChargingSessionDto) {
    return this.evService.recordSession(dto);
  }

  @Get('sessions')
  async getSessions(@Query('communityId') communityId: string) {
    return this.evService.getSessions(communityId);
  }
}
