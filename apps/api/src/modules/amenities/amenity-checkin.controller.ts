import { Controller, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityCheckInService } from './amenity-checkin.service.js';

@Controller('amenities/checkin')
@UseGuards(AuthGuard)
export class AmenityCheckInController {
  constructor(private readonly checkInService: AmenityCheckInService) {}

  @Post(':id')
  async checkIn(@Param('id') bookingId: string) {
    return this.checkInService.checkIn(bookingId);
  }

  @Post(':id/checkout')
  async checkOut(@Param('id') bookingId: string) {
    return this.checkInService.checkOut(bookingId);
  }

  @Post('no-shows/process')
  async processNoShows(@Query('communityId') communityId: string) {
    return this.checkInService.processNoShows(communityId);
  }
}
