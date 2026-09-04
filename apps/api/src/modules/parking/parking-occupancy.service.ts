import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RecordOccupancyDto } from '@community-os/contracts';

@Injectable()
export class ParkingOccupancyService {
  constructor(private readonly prisma: PrismaService) {}

  async recordOccupancy(dto: RecordOccupancyDto) {
    const area = await this.prisma.parkingArea.findUnique({ where: { id: dto.parkingAreaId } });
    if (!area) throw new NotFoundException('Parking area not found');

    return this.prisma.parkingOccupancySession.create({
      data: {
        organization: { connect: { id: area.organizationId } },
        community: { connect: { id: dto.communityId } },
        parkingArea: { connect: { id: dto.parkingAreaId } },
        parkingSlot: dto.parkingSlotId ? { connect: { id: dto.parkingSlotId } } : undefined,
        vehicle: { connect: { id: dto.vehicleId } },
        sourceType: dto.sourceType || 'SECURITY_GATE',
        entryGateId: dto.entryGateId,
        status: 'ACTIVE',
      },
    });
  }

  async recordExit(vehicleId: string, exitGateId?: string) {
    const active = await this.prisma.parkingOccupancySession.findFirst({
      where: { vehicleId, status: 'ACTIVE' },
    });

    if (active) {
      return this.prisma.parkingOccupancySession.update({
        where: { id: active.id },
        data: {
          status: 'COMPLETED',
          exitAt: new Date(),
          exitGateId,
        },
      });
    }
    return { status: 'NO_ACTIVE_SESSION' };
  }

  async manualCorrection(
    sessionId: string,
    correctedSlotId: string,
    reason: string,
    _userId?: string,
  ) {
    return this.prisma.parkingOccupancySession.update({
      where: { id: sessionId },
      data: {
        parkingSlot: { connect: { id: correctedSlotId } },
        status: 'MANUALLY_CORRECTED',
        correctionReason: reason,
      },
    });
  }

  async getActiveSessions(communityId: string) {
    return this.prisma.parkingOccupancySession.findMany({
      where: { communityId, status: 'ACTIVE' },
      include: { vehicle: true, parkingArea: true, parkingSlot: true },
      orderBy: { entryAt: 'desc' },
    });
  }
}
