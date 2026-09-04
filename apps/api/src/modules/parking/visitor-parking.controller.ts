import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { VisitorParkingService } from './visitor-parking.service.js';
import { EvaluateVisitorParkingDto } from '@community-os/contracts';

@Controller('parking/visitor-sessions')
@UseGuards(AuthGuard)
export class VisitorParkingController {
  constructor(private readonly visitorParkingService: VisitorParkingService) {}

  @Post('evaluate')
  async evaluateVisitorParking(@Body() dto: EvaluateVisitorParkingDto) {
    return this.visitorParkingService.evaluateVisitorParking(dto);
  }

  @Post('release/:visitId')
  async releaseVisitorParking(@Param('visitId') visitId: string) {
    return this.visitorParkingService.releaseVisitorParking(visitId);
  }

  @Get('active')
  async getActiveSessions(@Query('communityId') communityId: string) {
    return this.visitorParkingService.getActiveSessions(communityId);
  }
}
