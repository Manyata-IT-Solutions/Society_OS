import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UtilitiesDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(communityId: string) {
    const activeServices = await this.prisma.utilityService.count({
      where: { communityId, status: 'ACTIVE' },
    });
    const totalMeters = await this.prisma.utilityMeter.count({
      where: { communityId, status: 'ACTIVE' },
    });
    const openAnomalies = await this.prisma.utilityAnomaly.count({
      where: { communityId, status: 'OPEN' },
    });
    const openOutages = await this.prisma.utilityOutage.count({
      where: { communityId, status: 'IN_PROGRESS' },
    });

    return {
      activeServices,
      totalMeters,
      openAnomalies,
      openOutages,
      solarSharePct: 20.0,
      recycledWaterPct: 15.0,
    };
  }
}
