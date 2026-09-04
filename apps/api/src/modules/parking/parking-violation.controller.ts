import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ParkingViolationService } from './parking-violation.service.js';
import { CreateParkingViolationDto, DecideViolationAppealDto } from '@community-os/contracts';

@Controller('parking/violations')
@UseGuards(AuthGuard)
export class ParkingViolationController {
  constructor(private readonly violationService: ParkingViolationService) {}

  @Post()
  async createViolation(@Body() dto: CreateParkingViolationDto, @Req() req: any) {
    return this.violationService.createViolation(dto, req.user?.sub || req.user?.id);
  }

  @Post(':id/confirm')
  async confirmViolation(
    @Param('id') id: string,
    @Body() body: { penaltyAmount?: number },
    @Req() req: any,
  ) {
    return this.violationService.confirmViolation(
      id,
      body.penaltyAmount,
      req.user?.sub || req.user?.id,
    );
  }

  @Post(':id/appeal')
  async appealViolation(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.violationService.appealViolation(id, req.user?.sub || req.user?.id, body.reason);
  }

  @Post('appeals/decide')
  async decideAppeal(@Body() dto: DecideViolationAppealDto, @Req() req: any) {
    return this.violationService.decideAppeal(dto, req.user?.sub || req.user?.id);
  }

  @Get()
  async getViolations(@Query('communityId') communityId: string) {
    return this.violationService.getViolations(communityId);
  }
}
