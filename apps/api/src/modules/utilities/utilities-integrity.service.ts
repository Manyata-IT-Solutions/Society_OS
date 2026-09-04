import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UtilitiesIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async runIntegrityAudit(communityId: string) {
    const metersWithoutAssignments = await this.prisma.utilityMeter.findMany({
      where: { communityId, meterType: 'SUB_METER', assignments: { none: {} } },
    });

    const uncalculatedConsumptions = await this.prisma.utilityConsumptionRecord.findMany({
      where: { meter: { communityId }, chargeCalculations: { none: {} } },
    });

    return {
      communityId,
      metersWithoutAssignments: metersWithoutAssignments.map((m) => m.id),
      uncalculatedConsumptions: uncalculatedConsumptions.map((c) => c.id),
      discrepanciesCount: metersWithoutAssignments.length + uncalculatedConsumptions.length,
      auditTimestamp: new Date().toISOString(),
    };
  }
}
