import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UtilityAnomalyService {
  constructor(private readonly prisma: PrismaService) {}

  async detectAnomalies(communityId: string, period: string) {
    const highConsumptions = await this.prisma.utilityConsumptionRecord.findMany({
      where: { meter: { communityId }, consumption: { gt: 500 } },
      include: { meter: true },
    });

    const anomalies: any[] = [];
    for (const c of highConsumptions) {
      const anom = await this.prisma.utilityAnomaly.create({
        data: {
          communityId,
          utilityServiceId: c.meter.utilityServiceId,
          meterId: c.meterId,
          anomalyType: 'CONSUMPTION_SPIKE',
          period,
          severity: 'HIGH',
          observedValue: c.consumption,
          baselineValue: 150.0,
          status: 'OPEN',
        },
      });
      anomalies.push(anom);
    }

    return anomalies;
  }

  async listAnomalies(communityId: string) {
    return this.prisma.utilityAnomaly.findMany({
      where: { communityId },
      include: { meter: true, utilityService: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
