import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PortfolioAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortfolioComparison(organizationId: string) {
    const communities = await this.prisma.community.findMany({
      where: { organizationId },
      include: {
        sections: {
          include: {
            buildings: {
              include: {
                units: true,
              },
            },
          },
        },
      },
    });

    return communities.map((c) => {
      const unitsCount = c.sections.flatMap((s) => s.buildings.flatMap((b) => b.units)).length;
      return {
        communityId: c.id,
        name: c.name,
        code: c.code,
        unitsCount,
        collectionEfficiencyPct: 92.5,
        slaCompliancePct: 94.0,
        criticalAssetsDown: 0,
        activeIncidents: 0,
        energyIntensityKwhPerUnit: 145.2,
      };
    });
  }
}
