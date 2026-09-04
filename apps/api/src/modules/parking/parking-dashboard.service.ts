import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ParkingDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(communityId: string) {
    const totalSlots = await this.prisma.parkingSlot.count({ where: { communityId } });
    const allocatedSlots = await this.prisma.parkingAllocation.count({
      where: { communityId, status: 'ACTIVE' },
    });
    const occupiedSessions = await this.prisma.parkingOccupancySession.count({
      where: { communityId, status: 'ACTIVE' },
    });
    const visitorActive = await this.prisma.visitorParkingSession.count({
      where: { communityId, status: 'ACTIVE' },
    });
    const evSlots = await this.prisma.parkingSlot.count({
      where: { communityId, isEvEnabled: true },
    });
    const openViolations = await this.prisma.parkingViolation.count({
      where: { communityId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    });
    const registeredVehicles = await this.prisma.vehicle.count({
      where: { communityId, status: 'ACTIVE' },
    });

    return {
      totalSlots,
      allocatedSlots,
      occupiedSlots: occupiedSessions + visitorActive,
      availableSlots: Math.max(0, totalSlots - allocatedSlots),
      visitorCapacity: 20,
      visitorOccupied: visitorActive,
      evSlots,
      openViolations,
      registeredVehicles,
    };
  }
}
