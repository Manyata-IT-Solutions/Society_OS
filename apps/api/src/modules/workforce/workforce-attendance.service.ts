import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { RecordAttendanceDto } from '@community-os/contracts';

@Injectable()
export class WorkforceAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(dto: RecordAttendanceDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Concurrency safe: check for existing active session for today
    return this.prisma.$transaction(async (tx) => {
      let session = await tx.attendanceSession.findFirst({
        where: {
          workerId: dto.workerId,
          attendanceDate: today,
          status: { in: ['PRESENT', 'LATE'] },
        },
      });

      // Geofence evaluation if coordinates are supplied
      let geofenceDecision = 'VALID';
      if (dto.latitude && dto.longitude) {
        // e.g. If outside 500m radius of community coordinates, flag
        if (dto.accuracyMeters && dto.accuracyMeters > 200) {
          geofenceDecision = 'LOW_ACCURACY';
        }
      }

      if (!session) {
        session = await tx.attendanceSession.create({
          data: {
            organization: { connect: { id: dto.organizationId } },
            community: { connect: { id: dto.communityId } },
            worker: { connect: { id: dto.workerId } },
            shiftAssignment: dto.shiftAssignmentId
              ? { connect: { id: dto.shiftAssignmentId } }
              : undefined,
            attendanceDate: today,
            checkInAt: new Date(),
            status: 'PRESENT',
            checkInMethod: dto.method || 'MOBILE',
            checkInLocation:
              dto.latitude && dto.longitude ? `${dto.latitude},${dto.longitude}` : 'MAIN_FACILITY',
            sourceDeviceId: dto.sourceDeviceId,
          },
        });
      }

      // Record immutable append-only event
      await tx.attendanceEvent.create({
        data: {
          session: { connect: { id: session.id } },
          worker: { connect: { id: dto.workerId } },
          eventType: 'CHECK_IN',
          method: dto.method || 'MOBILE',
          latitude: dto.latitude,
          longitude: dto.longitude,
          geofenceDecision,
          sourceDeviceId: dto.sourceDeviceId,
          rawPayload: dto.rawEventNonce ? { nonce: dto.rawEventNonce } : undefined,
        },
      });

      return session;
    });
  }

  async checkOut(sessionId: string, dto?: Partial<RecordAttendanceDto>) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.attendanceSession.update({
        where: { id: sessionId },
        data: {
          checkOutAt: new Date(),
          checkOutMethod: dto?.method || 'MOBILE',
          checkOutLocation:
            dto?.latitude && dto?.longitude ? `${dto.latitude},${dto.longitude}` : 'MAIN_FACILITY',
        },
      });

      await tx.attendanceEvent.create({
        data: {
          session: { connect: { id: sessionId } },
          worker: { connect: { id: session.workerId } },
          eventType: 'CHECK_OUT',
          method: dto?.method || 'MOBILE',
          latitude: dto?.latitude,
          longitude: dto?.longitude,
          geofenceDecision: 'VALID',
        },
      });

      return session;
    });
  }

  async getAttendance(communityId: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    return this.prisma.attendanceSession.findMany({
      where: {
        communityId,
        attendanceDate: targetDate,
      },
      include: {
        worker: true,
        events: true,
        shiftAssignment: { include: { shiftInstance: true } },
      },
      orderBy: { checkInAt: 'desc' },
    });
  }

  async processMissingCheckouts(communityId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        communityId,
        attendanceDate: { lte: yesterday },
        checkOutAt: null,
        status: 'PRESENT',
      },
    });

    for (const s of sessions) {
      await this.prisma.attendanceSession.update({
        where: { id: s.id },
        data: { status: 'MISSING_CHECKOUT' },
      });
    }

    return { flaggedCount: sessions.length };
  }
}
