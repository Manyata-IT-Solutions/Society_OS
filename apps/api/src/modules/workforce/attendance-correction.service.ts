import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AttendanceCorrectionRequestDto, DecideCorrectionDto } from '@community-os/contracts';

@Injectable()
export class AttendanceCorrectionService {
  constructor(private readonly prisma: PrismaService) {}

  async requestCorrection(dto: AttendanceCorrectionRequestDto, workerId?: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: dto.attendanceSessionId },
    });
    if (!session) throw new NotFoundException('Attendance session not found');

    return this.prisma.attendanceCorrectionRequest.create({
      data: {
        session: { connect: { id: dto.attendanceSessionId } },
        workerId: workerId || session.workerId,
        requestedCheckInAt: dto.requestedCheckInAt ? new Date(dto.requestedCheckInAt) : undefined,
        requestedCheckOutAt: dto.requestedCheckOutAt
          ? new Date(dto.requestedCheckOutAt)
          : undefined,
        reason: dto.reason,
        evidenceDocument: dto.evidenceDocumentId
          ? { connect: { id: dto.evidenceDocumentId } }
          : undefined,
        status: 'PENDING',
      },
    });
  }

  async decideCorrection(dto: DecideCorrectionDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const correction = await tx.attendanceCorrectionRequest.findUnique({
        where: { id: dto.correctionId },
        include: { session: true },
      });
      if (!correction) throw new NotFoundException('Correction request not found');

      if (dto.approved) {
        await tx.attendanceSession.update({
          where: { id: correction.attendanceSessionId },
          data: {
            checkInAt: correction.requestedCheckInAt || correction.session.checkInAt,
            checkOutAt: correction.requestedCheckOutAt || correction.session.checkOutAt,
            status: 'CORRECTED',
          },
        });

        // Append correction event
        await tx.attendanceEvent.create({
          data: {
            session: { connect: { id: correction.attendanceSessionId } },
            worker: { connect: { id: correction.workerId } },
            eventType: 'MANUAL_CORRECTION',
            method: 'MANUAL',
            rawPayload: { approvedBy: userId, notes: dto.decisionNotes },
          },
        });
      }

      return tx.attendanceCorrectionRequest.update({
        where: { id: dto.correctionId },
        data: {
          status: dto.approved ? 'APPROVED' : 'REJECTED',
          approvedBy: userId ? { connect: { id: userId } } : undefined,
          decidedAt: new Date(),
          decisionNotes: dto.decisionNotes,
        },
      });
    });
  }

  async getPendingCorrections(communityId?: string) {
    return this.prisma.attendanceCorrectionRequest.findMany({
      where: {
        status: 'PENDING',
        ...(communityId ? { session: { communityId } } : {}),
      },
      include: { session: { include: { worker: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
