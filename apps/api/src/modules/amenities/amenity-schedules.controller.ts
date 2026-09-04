import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityScheduleService } from './amenity-schedule.service.js';
import { SetOperatingScheduleDto } from '@community-os/contracts';

@Controller('amenities/schedules')
@UseGuards(AuthGuard)
export class AmenitySchedulesController {
  constructor(private readonly scheduleService: AmenityScheduleService) {}

  @Post('operating')
  async setOperatingSchedule(@Body() dto: SetOperatingScheduleDto) {
    return this.scheduleService.setOperatingSchedule(dto);
  }

  @Post('special')
  async setSpecialSchedule(
    @Body()
    body: {
      amenityId: string;
      specificDate: string;
      isClosed: boolean;
      openTime?: string;
      closeTime?: string;
      reason?: string;
    },
  ) {
    return this.scheduleService.setSpecialSchedule(
      body.amenityId,
      body.specificDate,
      body.isClosed,
      body.openTime,
      body.closeTime,
      body.reason,
    );
  }

  @Get()
  async getSchedules(@Query('amenityId') amenityId: string) {
    return this.scheduleService.getSchedules(amenityId);
  }
}
