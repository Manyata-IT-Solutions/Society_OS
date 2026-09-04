import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CheckAvailabilityDto } from '@community-os/contracts';

@Injectable()
export class AmenityAvailabilityEngine {
  constructor(private readonly prisma: PrismaService) {}

  async checkAvailability(dto: CheckAvailabilityDto) {
    const amenity = await this.prisma.amenity.findUnique({
      where: { id: dto.amenityId },
      include: {
        resources: { where: { status: 'ACTIVE' } },
        operatingSchedules: true,
        specialSchedules: true,
        bookingPolicies: { where: { isDefault: true } },
      },
    });

    if (!amenity) throw new NotFoundException('Amenity not found');

    const targetDate = new Date(dto.date);
    const dayOfWeek = targetDate.getDay();

    // Check special holiday closure
    const special = amenity.specialSchedules.find(
      (s) => s.specificDate.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10),
    );
    if (special && special.isClosed) {
      return { available: false, reason: `Closed on this date: ${special.reason}`, slots: [] };
    }

    // Get operating schedule
    const schedule = amenity.operatingSchedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!schedule) {
      return {
        available: false,
        reason: 'No operating schedule configured for this day',
        slots: [],
      };
    }

    const resources = dto.resourceId
      ? amenity.resources.filter((r) => r.id === dto.resourceId)
      : amenity.resources;

    // Retrieve existing bookings and maintenance blocks on this date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await this.prisma.amenityBooking.findMany({
      where: {
        amenityId: dto.amenityId,
        status: {
          in: ['CONFIRMED', 'PENDING_APPROVAL', 'PENDING_PAYMENT', 'CHECKED_IN', 'IN_USE'],
        },
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const maintenanceBlocks = await this.prisma.amenityMaintenanceBlock.findMany({
      where: {
        amenityId: dto.amenityId,
        status: 'ACTIVE',
        startAt: { lte: endOfDay },
        endAt: { gte: startOfDay },
      },
    });

    return {
      available: true,
      operatingHours: `${schedule.openTime} - ${schedule.closeTime}`,
      resources: resources.map((r) => {
        const resourceBookings = existingBookings.filter((b) => b.resourceId === r.id);
        const resourceBlocks = maintenanceBlocks.filter(
          (m) => m.resourceId === r.id || !m.resourceId,
        );
        return {
          id: r.id,
          name: r.name,
          code: r.code,
          capacity: r.capacity,
          resourceType: r.resourceType,
          isBlocked: resourceBlocks.length > 0,
          confirmedBookingsCount: resourceBookings.length,
        };
      }),
    };
  }
}
