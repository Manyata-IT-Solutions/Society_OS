import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityWaitlistService } from './amenity-waitlist.service.js';
import { JoinWaitlistDto } from '@community-os/contracts';

@Controller('amenities/waitlist')
@UseGuards(AuthGuard)
export class AmenityWaitlistController {
  constructor(private readonly waitlistService: AmenityWaitlistService) {}

  @Post('join')
  async joinWaitlist(@Body() dto: JoinWaitlistDto) {
    return this.waitlistService.joinWaitlist(dto);
  }

  @Post(':id/accept')
  async acceptOffer(@Param('id') id: string) {
    return this.waitlistService.acceptOffer(id);
  }

  @Get()
  async getWaitlist(@Query('amenityId') amenityId: string) {
    return this.waitlistService.getWaitlist(amenityId);
  }
}
