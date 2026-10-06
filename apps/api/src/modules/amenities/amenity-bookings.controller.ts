import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityBookingService } from './amenity-booking.service.js';
import { CreateBookingDto, DecideBookingApprovalDto } from '@community-os/contracts';

@Controller('amenities/bookings')
@UseGuards(AuthGuard)
export class AmenityBookingsController {
  constructor(private readonly bookingService: AmenityBookingService) {}

  @Post()
  async createBooking(@Body() dto: CreateBookingDto, @Req() _req: any) {
    return this.bookingService.createBooking(dto);
  }

  @Post('approvals/decide')
  async decideApproval(@Body() dto: DecideBookingApprovalDto, @Req() req: any) {
    return this.bookingService.decideApproval(dto, req.user?.sub || req.user?.id);
  }

  @Post(':id/cancel')
  async cancelBooking(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.bookingService.cancelBooking(id, body?.reason);
  }

  @Post(':id/reschedule')
  async rescheduleBooking(
    @Param('id') id: string,
    @Body() body: { startAt: string; endAt: string },
  ) {
    return this.bookingService.rescheduleBooking(id, body.startAt, body.endAt);
  }

  @Get()
  async getBookings(@Query('communityId') communityId: string, @Query('status') status?: string) {
    return this.bookingService.getBookings(communityId, status);
  }
}
