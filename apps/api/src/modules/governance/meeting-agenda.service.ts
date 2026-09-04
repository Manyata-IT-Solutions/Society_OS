import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateMeetingAgendaDto } from '@community-os/contracts';

@Injectable()
export class MeetingAgendaService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrVersionAgenda(dto: CreateMeetingAgendaDto, approvedById?: string) {
    const meeting = await this.prisma.governanceMeeting.findUnique({
      where: { id: dto.meetingId },
      include: { agendas: { orderBy: { versionNumber: 'desc' } } },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${dto.meetingId} not found`);
    }

    const nextVersion = (meeting.agendas[0]?.versionNumber || 0) + 1;

    // Supersede previous agendas
    if (meeting.agendas.length > 0) {
      await this.prisma.meetingAgenda.updateMany({
        where: { meetingId: dto.meetingId, status: 'PUBLISHED' },
        data: { status: 'SUPERSEDED' },
      });
    }

    const agenda = await this.prisma.meetingAgenda.create({
      data: {
        meetingId: dto.meetingId,
        versionNumber: nextVersion,
        title: dto.title || `Meeting Agenda v${nextVersion}`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        approvedById,
        items: {
          create: dto.items.map((item, index) => ({
            itemNumber: item.itemNumber || String(index + 1),
            title: item.title,
            description: item.description,
            itemType: item.itemType || 'DISCUSSION',
            presenter: item.presenter,
            estimatedDurationMinutes: item.estimatedDurationMinutes || 15,
            decisionRequired: item.decisionRequired || false,
            votingExpected: item.votingExpected || false,
            linkedSourceType: item.linkedSourceType,
            linkedSourceId: item.linkedSourceId,
            displayOrder: item.displayOrder || index + 1,
          })),
        },
      },
      include: { items: true },
    });

    await this.prisma.governanceMeeting.update({
      where: { id: dto.meetingId },
      data: { status: 'AGENDA_PUBLISHED' },
    });

    return agenda;
  }

  async getLatestAgenda(meetingId: string) {
    const agenda = await this.prisma.meetingAgenda.findFirst({
      where: { meetingId, status: 'PUBLISHED' },
      include: { items: { orderBy: { displayOrder: 'asc' } } },
    });
    return agenda;
  }
}
