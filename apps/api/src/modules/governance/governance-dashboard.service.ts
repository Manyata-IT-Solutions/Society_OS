import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class GovernanceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(communityId: string) {
    const upcomingMeetings = await this.prisma.governanceMeeting.count({
      where: {
        communityId,
        status: { in: ['SCHEDULED', 'NOTICE_PUBLISHED', 'AGENDA_PUBLISHED'] },
      },
    });

    const openVotes = await this.prisma.governanceVote.count({
      where: { meeting: { communityId }, status: 'OPEN' },
    });

    const openActionItems = await this.prisma.governanceActionItem.count({
      where: { communityId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });

    const publishedNotices = await this.prisma.governanceNotice.count({
      where: { communityId, status: 'PUBLISHED' },
    });

    const activePolicies = await this.prisma.governancePolicy.count({
      where: { communityId, status: 'EFFECTIVE' },
    });

    const totalResolutions = await this.prisma.governanceResolution.count({
      where: { communityId },
    });

    return {
      upcomingMeetings,
      openVotes,
      openActionItems,
      publishedNotices,
      activePolicies,
      totalResolutions,
    };
  }
}
