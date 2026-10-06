import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ParkingPermitService } from './parking-permit.service.js';
import { IssueParkingPermitDto } from '@community-os/contracts';

@Controller('parking/permits')
@UseGuards(AuthGuard)
export class ParkingPermitController {
  constructor(private readonly permitService: ParkingPermitService) {}

  @Post()
  async issuePermit(@Body() dto: IssueParkingPermitDto) {
    return this.permitService.issuePermit(dto);
  }

  @Post(':id/revoke')
  async revokePermit(@Param('id') id: string) {
    return this.permitService.revokePermit(id);
  }

  @Get()
  async getPermits(@Query('communityId') communityId: string) {
    return this.permitService.getPermits(communityId);
  }
}
