import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { GenerateMinutesDraftDto, ApproveMinutesDto } from '@community-os/contracts';

@Injectable()
export class MeetingMinutesService {
  constructor(private readonly prisma: PrismaService) {}

  async generateStructuredMinutesDraft(dto: GenerateMinutesDraftDto) {
    const meeting = await this.prisma.governanceMeeting.findUnique({
      where: { id: dto.meetingId },
      include: {
        agendas: { where: { status: 'PUBLISHED' }, include: { items: true } },
        attendances: { where: { attendanceStatus: 'PRESENT' } },
        quorumSnapshots: { orderBy: { calculatedAt: 'desc' } },
        motions: true,
        votes: true,
        resolutions: true,
        actionItems: true,
      },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${dto.meetingId} not found`);
    }

    const structuredContent = {
      meetingNumber: meeting.meetingNumber,
      title: meeting.title,
      scheduledStartAt: meeting.scheduledStartAt,
      actualStartAt: meeting.actualStartAt,
      actualEndAt: meeting.actualEndAt,
      attendanceSummary: {
        presentCount: meeting.attendances.length,
        quorumStatus: meeting.quorumSnapshots[0]?.status || 'NOT_EVALUATED',
      },
      agendaOutcomes:
        meeting.agendas[0]?.items.map((i: any) => ({
          itemNumber: i.itemNumber,
          title: i.title,
        })) || [],
      motionsCount: meeting.motions.length,
      resolutionsCount: meeting.resolutions.length,
      actionItemsCount: meeting.actionItems.length,
    };

    const count = await this.prisma.meetingMinutes.count({
      where: { meetingId: dto.meetingId },
    });
    const minutesNumber = `MIN-${meeting.meetingNumber}`;

    const minutes = await this.prisma.meetingMinutes.create({
      data: {
        meetingId: dto.meetingId,
        minutesNumber,
        versionNumber: count + 1,
        summary: dto.summary || `Official Minutes of Meeting ${meeting.meetingNumber}`,
        content: structuredContent,
        status: 'UNDER_REVIEW',
        preparedById: dto.preparedByUserId,
      },
    });

    return minutes;
  }

  async approveAndPublishMinutes(dto: ApproveMinutesDto) {
    const minutes = await this.prisma.meetingMinutes.findUnique({
      where: { id: dto.minutesId },
    });
    if (!minutes) {
      throw new NotFoundException(`Minutes with ID ${dto.minutesId} not found`);
    }

    const updated = await this.prisma.meetingMinutes.update({
      where: { id: dto.minutesId },
      data: {
        status: 'PUBLISHED',
        approvedById: dto.approvedByUserId,
        publishedAt: new Date(),
      },
    });

    return updated;
  }
}
