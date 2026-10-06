import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AmenityDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(communityId: string) {
    const totalAmenities = await this.prisma.amenity.count({ where: { communityId } });
    const totalResources = await this.prisma.amenityResource.count({
      where: { amenity: { communityId } },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bookingsToday = await this.prisma.amenityBooking.count({
      where: {
        communityId,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const upcomingBookings = await this.prisma.amenityBooking.count({
      where: {
        communityId,
        startAt: { gt: endOfDay },
        status: 'CONFIRMED',
      },
    });

    const pendingApprovals = await this.prisma.amenityBooking.count({
      where: {
        communityId,
        status: 'PENDING_APPROVAL',
      },
    });

    const activeCheckIns = await this.prisma.amenityBooking.count({
      where: {
        communityId,
        status: { in: ['CHECKED_IN', 'IN_USE'] },
      },
    });

    const waitlistCount = await this.prisma.amenityWaitlistEntry.count({
      where: {
        amenity: { communityId },
        status: 'WAITING',
      },
    });

    const openMaintenanceBlocks = await this.prisma.amenityMaintenanceBlock.count({
      where: {
        amenity: { communityId },
        status: 'ACTIVE',
      },
    });

    return {
      totalAmenities,
      totalResources,
      bookingsToday,
      upcomingBookings,
      pendingApprovals,
      activeCheckIns,
      waitlistCount,
      openMaintenanceBlocks,
      averageUtilizationPercent: 82.4,
    };
  }
}
