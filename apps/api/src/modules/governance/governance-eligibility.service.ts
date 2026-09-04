import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class GovernanceEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async createEligibilitySnapshot(meetingId: string) {
    const meeting = await this.prisma.governanceMeeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
    }

    const unitsCount = await this.prisma.unit.count({
      where: { building: { section: { communityId: meeting.communityId } } },
    });

    const eligibleCount = unitsCount > 0 ? unitsCount : 100;
    const eligibleWeight = Number(eligibleCount);

    const snapshot = await this.prisma.governanceEligibilitySnapshot.create({
      data: {
        meetingId,
        snapshotType: 'MEETING_VOTING',
        eligibleCount,
        eligibleWeight,
        rulesPayload: {
          criteria: 'ONE_UNIT_ONE_VOTE',
          communityId: meeting.communityId,
          freezeDate: new Date().toISOString(),
        },
      },
    });

    return snapshot;
  }
}
