import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, AssetMeter, AssetMeterReading } from '@prisma/client';

@Injectable()
export class AssetMeterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMeter(data: Prisma.AssetMeterCreateInput): Promise<AssetMeter> {
    return this.prisma.assetMeter.create({ data });
  }

  async findMeterById(id: string): Promise<AssetMeter | null> {
    return this.prisma.assetMeter.findUnique({
      where: { id },
      include: {
        asset: true,
        readings: { orderBy: { recordedAt: 'desc' }, take: 10 },
      },
    });
  }

  async findMetersByAssetId(assetId: string): Promise<AssetMeter[]> {
    return this.prisma.assetMeter.findMany({
      where: { assetId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async addReading(
    meterId: string,
    readingData: Prisma.AssetMeterReadingCreateWithoutMeterInput,
    newCurrentReading: number,
    recordedAt: Date,
  ): Promise<AssetMeterReading> {
    return this.prisma.$transaction(async (tx) => {
      const reading = await tx.assetMeterReading.create({
        data: {
          ...readingData,
          meter: { connect: { id: meterId } },
        },
      });

      await tx.assetMeter.update({
        where: { id: meterId },
        data: {
          currentReading: newCurrentReading,
          lastRecordedAt: recordedAt,
        },
      });

      return reading;
    });
  }

  async getReadingHistory(meterId: string, limit = 50): Promise<AssetMeterReading[]> {
    return this.prisma.assetMeterReading.findMany({
      where: { meterId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      include: { recordedByUser: true },
    });
  }
}
