import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AmenityCheckInService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(bookingId: string) {
    const booking = await this.prisma.amenityBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
      throw new BadRequestException('Cannot check in to cancelled or rejected booking');
    }

    return this.prisma.amenityBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_IN',
        checkInAt: new Date(),
      },
    });
  }

  async checkOut(bookingId: string) {
    return this.prisma.amenityBooking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        checkOutAt: new Date(),
      },
    });
  }

  async processNoShows(communityId: string) {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const bookings = await this.prisma.amenityBooking.findMany({
      where: {
        communityId,
        status: 'CONFIRMED',
        startAt: { lte: thirtyMinsAgo },
        checkInAt: null,
      },
    });

    for (const b of bookings) {
      await this.prisma.amenityBooking.update({
        where: { id: b.id },
        data: { status: 'NO_SHOW' },
      });
    }

    return { processedCount: bookings.length };
  }
}
