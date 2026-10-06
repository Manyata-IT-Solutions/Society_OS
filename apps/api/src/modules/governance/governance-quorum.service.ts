import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { EvaluateQuorumDto } from '@community-os/contracts';

@Injectable()
export class GovernanceQuorumService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateQuorum(dto: EvaluateQuorumDto) {
    const meeting = await this.prisma.governanceMeeting.findUnique({
      where: { id: dto.meetingId },
      include: {
        attendances: { where: { attendanceStatus: 'PRESENT' } },
        eligibilitySnapshots: { orderBy: { capturedAt: 'desc' } },
      },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${dto.meetingId} not found`);
    }

    const policy = await this.prisma.quorumPolicy.findFirst({
      where: {
        OR: [
          { communityId: meeting.communityId, meetingType: meeting.meetingType },
          { organizationId: meeting.organizationId, meetingType: meeting.meetingType },
          { isDefault: true },
        ],
      },
    });

    const requiredPercentage = dto.requiredPercentage || Number(policy?.requiredPercentage || 25.0);
    const eligibleCount = meeting.eligibilitySnapshots[0]?.eligibleCount || 100;
    const requiredCount =
      dto.requiredHeadcount || Math.ceil((eligibleCount * requiredPercentage) / 100);
    const presentCount = meeting.attendances.length;
    const presentWeight = Number(presentCount);

    const isMet = presentCount >= requiredCount;
    const status = isMet ? 'MET' : 'NOT_MET';

    const snapshot = await this.prisma.meetingQuorumSnapshot.create({
      data: {
        meetingId: dto.meetingId,
        eligibilitySnapshotId: meeting.eligibilitySnapshots[0]?.id,
        eligibleCount,
        requiredCount,
        presentCount,
        presentWeight,
        status,
      },
    });

    return snapshot;
  }
}
