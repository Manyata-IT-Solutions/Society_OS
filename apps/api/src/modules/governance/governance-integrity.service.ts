import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class GovernanceIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async runIntegrityAudit(communityId: string) {
    const publishedMeetingsWithoutAgendas = await this.prisma.governanceMeeting.findMany({
      where: {
        communityId,
        status: { in: ['AGENDA_PUBLISHED', 'IN_PROGRESS', 'COMPLETED'] },
        agendas: { none: { status: 'PUBLISHED' } },
      },
    });

    const votesMissingEligibility = await this.prisma.governanceVote.findMany({
      where: {
        meeting: { communityId },
        status: 'OPEN',
        entitlements: { none: {} },
      },
    });

    return {
      communityId,
      discrepanciesFound: publishedMeetingsWithoutAgendas.length + votesMissingEligibility.length,
      publishedMeetingsWithoutAgendas: publishedMeetingsWithoutAgendas.map((m) => m.id),
      votesMissingEligibility: votesMissingEligibility.map((v) => v.id),
      auditTimestamp: new Date().toISOString(),
    };
  }
}
