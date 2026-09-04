import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RecordDGRunSessionDto } from '@community-os/contracts';

@Injectable()
export class DGOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordRunSession(dto: RecordDGRunSessionDto) {
    const generated = dto.closingEnergyReading - dto.openingEnergyReading;
    const efficiency = dto.fuelConsumedLitres > 0 ? generated / dto.fuelConsumedLitres : null;

    return this.prisma.dGRunSession.create({
      data: {
        communityId: dto.communityId,
        assetId: dto.assetId,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        openingEnergyReading: dto.openingEnergyReading,
        closingEnergyReading: dto.closingEnergyReading,
        generatedEnergy: generated,
        fuelConsumedLitres: dto.fuelConsumedLitres,
        efficiency,
        operatorWorkerId: dto.operatorWorkerId,
        status: 'COMPLETED',
      },
    });
  }

  async listSessions(communityId: string) {
    return this.prisma.dGRunSession.findMany({
      where: { communityId },
      include: { asset: true, operatorWorker: true },
      orderBy: { startAt: 'desc' },
    });
  }
}
