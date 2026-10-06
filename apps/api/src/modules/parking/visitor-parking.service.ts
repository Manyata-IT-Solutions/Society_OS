import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { EvaluateVisitorParkingDto } from '@community-os/contracts';

@Injectable()
export class VisitorParkingService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateVisitorParking(dto: EvaluateVisitorParkingDto) {
    const normalized = dto.vehicleNumber.replace(/[^0-9A-Z]/gi, '').toUpperCase();

    // Check visitor parking area capacity atomically
    return this.prisma.$transaction(async (tx) => {
      const visitorArea = await tx.parkingArea.findFirst({
        where: { communityId: dto.communityId, type: 'VISITOR', status: 'ACTIVE' },
        include: {
          slots: { where: { status: 'AVAILABLE' } },
          visitorSessions: { where: { status: 'ACTIVE' } },
        },
      });

      const maxCap = visitorArea?.totalCapacity || 20;
      const activeCount = visitorArea?.visitorSessions.length || 0;

      if (activeCount >= maxCap) {
        return {
          allowed: false,
          decision: 'FULL',
          reason: 'Visitor parking capacity full',
        };
      }

      // Find available visitor slot if modeled
      const slot = visitorArea?.slots[0];

      const session = await tx.visitorParkingSession.create({
        data: {
          community: { connect: { id: dto.communityId } },
          visit: { connect: { id: dto.visitId } },
          vehicleNumber: dto.vehicleNumber,
          normalizedVehicleNumber: normalized,
          parkingArea: visitorArea ? { connect: { id: visitorArea.id } } : undefined,
          parkingSlot: slot ? { connect: { id: slot.id } } : undefined,
          status: 'ACTIVE',
        },
      });

      return {
        allowed: true,
        decision: slot ? 'ALLOWED_WITH_SLOT' : 'ALLOWED_ZONE_ONLY',
        slotNumber: slot?.slotNumber || 'VISITOR-ZONE',
        sessionId: session.id,
      };
    });
  }

  async releaseVisitorParking(visitId: string) {
    const activeSession = await this.prisma.visitorParkingSession.findFirst({
      where: { visitId, status: 'ACTIVE' },
    });

    if (activeSession) {
      await this.prisma.visitorParkingSession.update({
        where: { id: activeSession.id },
        data: {
          status: 'COMPLETED',
          exitTime: new Date(),
        },
      });
    }

    return { released: true };
  }

  async getActiveSessions(communityId: string) {
    return this.prisma.visitorParkingSession.findMany({
      where: { communityId, status: 'ACTIVE' },
      include: {
        visit: { include: { destinationUnit: true, hostResident: true } },
        parkingSlot: true,
      },
      orderBy: { entryTime: 'desc' },
    });
  }
}
