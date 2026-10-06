import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityAvailabilityEngine } from './amenity-availability.engine.js';
import { CheckAvailabilityDto } from '@community-os/contracts';

@Controller('amenities/availability')
@UseGuards(AuthGuard)
export class AmenityAvailabilityController {
  constructor(private readonly availabilityEngine: AmenityAvailabilityEngine) {}

  @Post('check')
  async checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.availabilityEngine.checkAvailability(dto);
  }
}
