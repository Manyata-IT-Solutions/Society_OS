import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RecordAnomalyDto } from '@community-os/contracts';

@Injectable()
export class InsightAnomalyService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAnomaly(dto: RecordAnomalyDto) {
    return this.prisma.analyticsAnomaly.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        metricKey: dto.metricKey,
        period: dto.period,
        observedValue: dto.observedValue,
        baselineValue: dto.baselineValue,
        deviationPct: dto.deviationPct,
        method: dto.method || 'ROLLING_AVG',
        severity: dto.severity || 'WARNING',
        status: 'NEW',
        explanation: dto.explanation,
      },
    });
  }

  async listAnomalies(communityId?: string) {
    return this.prisma.analyticsAnomaly.findMany({
      where: communityId ? { communityId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async listInsights(communityId?: string) {
    return this.prisma.analyticsInsight.findMany({
      where: communityId ? { communityId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }
}
