import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SecurityDashboardKpis } from '@community-os/types';

@Injectable()
export class SecurityDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(communityId: string): Promise<SecurityDashboardKpis> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeVisitorsCount,
      expectedTodayCount,
      totalEntriesToday,
      totalExitsToday,
      pendingApprovalsCount,
      deliveriesTodayCount,
      contractorsInsideCount,
      watchlistAlertsCount,
      onlineDevicesCount,
    ] = await Promise.all([
      this.prisma.activeVisit.count({ where: { communityId } }),
      this.prisma.visit.count({ where: { communityId, expectedFrom: { gte: today } } }),
      this.prisma.gateAccessEvent.count({
        where: { communityId, eventType: 'CHECK_IN', eventTime: { gte: today } },
      }),
      this.prisma.gateAccessEvent.count({
        where: { communityId, eventType: 'CHECK_OUT', eventTime: { gte: today } },
      }),
      this.prisma.visitApproval.count({ where: { status: 'PENDING', visit: { communityId } } }),
      this.prisma.visit.count({
        where: { communityId, visitType: 'DELIVERY', createdAt: { gte: today } },
      }),
      this.prisma.activeVisit.count({
        where: { communityId, visitType: { in: ['CONTRACTOR', 'PROJECT_WORKER'] } },
      }),
      this.prisma.watchlistEntry.count({ where: { communityId, status: 'ACTIVE' } }),
      this.prisma.gateDevice.count({ where: { communityId, status: 'ONLINE' } }),
    ]);

    return {
      activeVisitorsCount,
      expectedTodayCount,
      totalEntriesToday,
      totalExitsToday,
      pendingApprovalsCount,
      deliveriesTodayCount,
      contractorsInsideCount,
      overstayAlertsCount: 0,
      watchlistAlertsCount,
      onlineDevicesCount,
    };
  }

  async getActiveVisits(communityId: string) {
    return this.prisma.activeVisit.findMany({
      where: { communityId },
      include: { visitor: true, entryGate: true },
      orderBy: { checkInTime: 'desc' },
    });
  }
}
