import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CommonAreaAllocationDto } from '@community-os/contracts';

@Injectable()
export class CommonAreaAllocationService {
  constructor(private readonly prisma: PrismaService) {}

  async allocateCommonUsage(dto: CommonAreaAllocationDto) {
    const pStart = new Date(dto.periodStart);
    const pEnd = new Date(dto.periodEnd);

    const consumption = await this.prisma.utilityConsumptionRecord.findFirst({
      where: { meterId: dto.meterId, periodStart: { lte: pStart }, periodEnd: { gte: pEnd } },
    });
    if (!consumption) throw new NotFoundException('Consumption record not found for common meter');

    const units = await this.prisma.unit.findMany({
      where: { building: { section: { communityId: dto.communityId } } },
    });

    const eligibleUnitCount = units.length > 0 ? units.length : 1;
    const totalUsage = Number(consumption.consumption);
    const allocatedPerUnit = totalUsage / eligibleUnitCount;

    return {
      communityId: dto.communityId,
      meterId: dto.meterId,
      totalCommonConsumption: totalUsage,
      eligibleUnitsCount: eligibleUnitCount,
      allocationPolicy: dto.allocationPolicy,
      allocatedPerUnit,
      allocationSnapshot: {
        calculatedAt: new Date().toISOString(),
        unitsCount: eligibleUnitCount,
        usage: totalUsage,
      },
    };
  }
}
