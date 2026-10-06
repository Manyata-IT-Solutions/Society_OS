import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RecordEVChargingSessionDto } from '@community-os/contracts';

@Injectable()
export class EVChargingService {
  constructor(private readonly prisma: PrismaService) {}

  async recordSession(dto: RecordEVChargingSessionDto) {
    return this.prisma.eVChargingSession.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        parkingSlot: { connect: { id: dto.parkingSlotId } },
        vehicle: { connect: { id: dto.vehicleId } },
        chargerAsset: dto.chargerAssetId ? { connect: { id: dto.chargerAssetId } } : undefined,
        resident: dto.residentId ? { connect: { id: dto.residentId } } : undefined,
        household: dto.householdId ? { connect: { id: dto.householdId } } : undefined,
        startAt: new Date(Date.now() - 3600000), // 1 hour ago
        endAt: new Date(),
        meterStartKwh: dto.meterStartKwh,
        meterEndKwh: dto.meterEndKwh,
        energyConsumedKwh: dto.energyConsumedKwh,
        billedAmount: dto.billedAmount,
        status: 'COMPLETED',
      },
      include: { parkingSlot: true, vehicle: true },
    });
  }

  async getSessions(communityId: string) {
    return this.prisma.eVChargingSession.findMany({
      where: { communityId },
      include: { parkingSlot: true, vehicle: true, resident: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
