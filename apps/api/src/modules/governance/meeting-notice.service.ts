import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PublishMeetingNoticeDto } from '@community-os/contracts';

@Injectable()
export class MeetingNoticeService {
  constructor(private readonly prisma: PrismaService) {}

  async publishMeetingNotice(dto: PublishMeetingNoticeDto, issuedById?: string) {
    const meeting = await this.prisma.governanceMeeting.findUnique({
      where: { id: dto.meetingId },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${dto.meetingId} not found`);
    }

    const minDays =
      dto.minimumNoticeDays ||
      (meeting.meetingType === 'AGM' ? 14 : meeting.meetingType === 'EGM' ? 7 : 3);

    const notice = await this.prisma.meetingNotice.create({
      data: {
        meetingId: dto.meetingId,
        noticeDate: new Date(),
        noticePeriodDays: minDays,
        instructions: dto.instructions || 'Official notice published to eligible members.',
        status: 'PUBLISHED',
        issuedById,
        publishedAt: new Date(),
        documentId: dto.attachmentDocumentIds?.[0],
      },
    });

    await this.prisma.governanceMeeting.update({
      where: { id: dto.meetingId },
      data: { status: 'NOTICE_PUBLISHED' },
    });

    return notice;
  }
}
