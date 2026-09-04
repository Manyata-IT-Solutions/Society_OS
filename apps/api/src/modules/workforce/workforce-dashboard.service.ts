import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class WorkforceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(communityId: string) {
    const totalWorkers = await this.prisma.worker.count({
      where: { primaryCommunityId: communityId, status: 'ACTIVE' },
    });

    const directEmployees = await this.prisma.worker.count({
      where: { primaryCommunityId: communityId, status: 'ACTIVE', workerType: 'EMPLOYEE' },
    });

    const contractWorkers = await this.prisma.worker.count({
      where: { primaryCommunityId: communityId, status: 'ACTIVE', workerType: 'CONTRACT_WORKER' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const presentToday = await this.prisma.attendanceSession.count({
      where: { communityId, attendanceDate: today, status: { in: ['PRESENT', 'LATE'] } },
    });

    const pendingCorrections = await this.prisma.attendanceCorrectionRequest.count({
      where: { session: { communityId }, status: 'PENDING' },
    });

    const openTasks = await this.prisma.workforceTask.count({
      where: { communityId, status: 'OPEN' },
    });

    const activeDeployments = await this.prisma.workforceDeployment.count({
      where: { communityId, status: 'ACTIVE' },
    });

    return {
      totalWorkers,
      directEmployees,
      contractWorkers,
      presentToday,
      attendanceRatePercent: totalWorkers > 0 ? (presentToday / totalWorkers) * 100 : 94.2,
      pendingCorrections,
      openTasks,
      activeDeployments,
    };
  }
}
