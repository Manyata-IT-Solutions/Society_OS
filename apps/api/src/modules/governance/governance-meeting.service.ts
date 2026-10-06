import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { GovernanceSequenceService } from './governance-sequence.service.js';
import { CreateMeetingDto } from '@community-os/contracts';

@Injectable()
export class GovernanceMeetingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: GovernanceSequenceService,
  ) {}

  async createMeeting(dto: CreateMeetingDto) {
    const prefix = dto.meetingType === 'AGM' ? 'AGM' : dto.meetingType === 'EGM' ? 'EGM' : 'MTG';
    const meetingNumber = await this.sequence.getNextMeetingNumber(dto.communityId, prefix);

    const meeting = await this.prisma.governanceMeeting.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        meetingNumber,
        meetingType: dto.meetingType || 'COMMITTEE',
        committeeId: dto.committeeId,
        committeeTermId: dto.committeeTermId,
        title: dto.title,
        description: dto.description,
        scheduledStartAt: new Date(dto.scheduledStartAt),
        scheduledEndAt: new Date(dto.scheduledEndAt),
        timezone: dto.timezone || 'UTC',
        venueType: dto.venueType || 'PHYSICAL',
        venueReference: dto.venueReference,
        onlineMeetingUrl: dto.onlineMeetingUrl,
        amenityBookingId: dto.amenityBookingReferenceId,
        status: 'SCHEDULED',
      },
      include: {
        committee: true,
        notices: true,
        agendas: true,
      },
    });

    return meeting;
  }

  async listMeetings(communityId: string, filters?: { meetingType?: string; status?: string }) {
    const where: any = { communityId };
    if (filters?.meetingType) where.meetingType = filters.meetingType;
    if (filters?.status) where.status = filters.status;

    return this.prisma.governanceMeeting.findMany({
      where,
      include: {
        committee: true,
        notices: true,
        agendas: { include: { items: true } },
        attendances: true,
        quorumSnapshots: true,
        resolutions: true,
        minutes: true,
      },
      orderBy: { scheduledStartAt: 'desc' },
    });
  }

  async getMeetingById(id: string) {
    const meeting = await this.prisma.governanceMeeting.findUnique({
      where: { id },
      include: {
        committee: true,
        notices: true,
        agendas: { include: { items: true } },
        attendances: {
          include: {
            resident: true,
            user: true,
            committeeMembership: { include: { position: true } },
          },
        },
        quorumSnapshots: true,
        motions: { include: { amendments: true, votes: true } },
        votes: { include: { ballots: true } },
        resolutions: true,
        minutes: true,
        actionItems: true,
      },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }
    return meeting;
  }

  async startMeeting(meetingId: string) {
    const meeting = await this.getMeetingById(meetingId);
    if (meeting.status === 'IN_PROGRESS' || meeting.status === 'COMPLETED') {
      return meeting;
    }

    const updated = await this.prisma.governanceMeeting.update({
      where: { id: meetingId },
      data: {
        status: 'IN_PROGRESS',
        actualStartAt: new Date(),
      },
    });

    return updated;
  }

  async completeMeeting(meetingId: string) {
    await this.getMeetingById(meetingId);
    const updated = await this.prisma.governanceMeeting.update({
      where: { id: meetingId },
      data: {
        status: 'COMPLETED',
        actualEndAt: new Date(),
      },
    });

    return updated;
  }

  async adjournMeeting(meetingId: string, reason?: string) {
    const updated = await this.prisma.governanceMeeting.update({
      where: { id: meetingId },
      data: {
        status: 'ADJOURNED',
        actualEndAt: new Date(),
        description: reason ? `ADJOURNED: ${reason}` : undefined,
      },
    });
    return updated;
  }
}
