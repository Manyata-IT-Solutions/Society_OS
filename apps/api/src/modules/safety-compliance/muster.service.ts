import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ConfirmMusterStatusDto, ResidentSelfSafeDto } from '@community-os/contracts';

@Injectable()
export class MusterService {
  constructor(private readonly prisma: PrismaService) {}

  async confirmStatus(dto: ConfirmMusterStatusDto, actorId?: string) {
    const session = await this.prisma.musterSession.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session) throw new NotFoundException('Muster session not found');

    const existing = await this.prisma.musterEntry.findFirst({
      where: { sessionId: dto.sessionId, subjectId: dto.subjectId },
    });

    if (existing) {
      return this.prisma.musterEntry.update({
        where: { id: existing.id },
        data: {
          accountabilityStatus: dto.accountabilityStatus,
          confirmedAt: new Date(),
          confirmedById: actorId,
          musterPointId: dto.musterPointId,
          notes: dto.notes,
        },
      });
    }

    return this.prisma.musterEntry.create({
      data: {
        sessionId: dto.sessionId,
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        accountabilityStatus: dto.accountabilityStatus,
        confirmedAt: new Date(),
        confirmedById: actorId,
        musterPointId: dto.musterPointId,
        notes: dto.notes,
      },
    });
  }

  async residentSelfSafe(dto: ResidentSelfSafeDto) {
    const session = await this.prisma.musterSession.findFirst({
      where: { incidentId: dto.incidentId, status: 'IN_PROGRESS' },
    });
    if (!session) throw new NotFoundException('No active muster session for incident');

    const entry = await this.prisma.musterEntry.create({
      data: {
        sessionId: session.id,
        subjectType: 'RESIDENT',
        subjectId: dto.residentId,
        unitId: dto.unitId,
        accountabilityStatus: dto.accountabilityStatus,
        confirmedAt: new Date(),
        notes: dto.needAssistance
          ? `ASSISTANCE NEEDED: ${dto.assistanceDetails || 'General Help'}`
          : 'Self-confirmed safe',
      },
    });

    return { success: true, entry };
  }

  async getMusterSummary(sessionId: string) {
    const entries = await this.prisma.musterEntry.findMany({
      where: { sessionId },
    });

    const total = entries.length;
    const safe = entries.filter(
      (e) =>
        e.accountabilityStatus === 'SAFE_AT_MUSTER' || e.accountabilityStatus === 'SAFE_ELSEWHERE',
    ).length;
    const unaccounted = entries.filter(
      (e) => e.accountabilityStatus === 'NOT_CHECKED' || e.accountabilityStatus === 'UNACCOUNTED',
    ).length;

    return {
      sessionId,
      totalTracked: total,
      confirmedSafe: safe,
      unaccounted,
      safePercentage: total > 0 ? (safe / total) * 100 : 100,
    };
  }
}
