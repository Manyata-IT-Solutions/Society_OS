import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { GovernanceSequenceService } from './governance-sequence.service.js';
import { CreateGovernanceNoticeDto } from '@community-os/contracts';

@Injectable()
export class GovernanceNoticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: GovernanceSequenceService,
  ) {}

  async publishNotice(dto: CreateGovernanceNoticeDto, createdById?: string, approvedById?: string) {
    const noticeNumber = await this.sequence.getNextNoticeNumber(dto.communityId);

    const notice = await this.prisma.governanceNotice.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        noticeNumber,
        noticeType: dto.noticeType || 'GENERAL',
        title: dto.title,
        summary: dto.summary,
        body: dto.body,
        audienceType: dto.audienceType || 'ALL',
        audienceTargetId: dto.audienceTargetId,
        priority: dto.priority || 'NORMAL',
        status: 'PUBLISHED',
        publishAt: dto.publishAt ? new Date(dto.publishAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        requiresAcknowledgement: dto.requiresAcknowledgement || false,
        createdById,
        approvedById,
      },
    });

    return notice;
  }

  async listNotices(communityId: string, noticeType?: string) {
    const where: any = { communityId };
    if (noticeType) where.noticeType = noticeType;

    return this.prisma.governanceNotice.findMany({
      where,
      include: {
        readReceipts: true,
        acknowledgements: true,
      },
      orderBy: { publishAt: 'desc' },
    });
  }
}
