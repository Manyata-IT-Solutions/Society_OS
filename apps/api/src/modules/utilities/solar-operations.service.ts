import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RecordSolarGenerationDto } from '@community-os/contracts';

@Injectable()
export class SolarOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordGeneration(dto: RecordSolarGenerationDto) {
    const genDate = new Date(dto.generationDate);

    return this.prisma.solarGenerationRecord.upsert({
      where: {
        communityId_assetId_generationDate: {
          communityId: dto.communityId,
          assetId: dto.assetId,
          generationDate: genDate,
        },
      },
      update: {
        generationKwh: dto.generationKwh,
        selfConsumedKwh: dto.selfConsumedKwh,
        exportedKwh: dto.exportedKwh,
      },
      create: {
        communityId: dto.communityId,
        assetId: dto.assetId,
        generationDate: genDate,
        generationKwh: dto.generationKwh,
        selfConsumedKwh: dto.selfConsumedKwh,
        exportedKwh: dto.exportedKwh,
      },
    });
  }
}
