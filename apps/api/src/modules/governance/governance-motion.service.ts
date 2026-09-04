import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProposeMotionDto, AmendMotionDto } from '@community-os/contracts';

@Injectable()
export class GovernanceMotionService {
  constructor(private readonly prisma: PrismaService) {}

  async proposeMotion(dto: ProposeMotionDto) {
    const count = await this.prisma.governanceMotion.count({
      where: { meetingId: dto.meetingId },
    });
    const motionNumber = `MOT-${String(count + 1).padStart(3, '0')}`;

    const motion = await this.prisma.governanceMotion.create({
      data: {
        meetingId: dto.meetingId,
        agendaItemId: dto.agendaItemId,
        motionNumber,
        title: dto.title,
        text: dto.text,
        proposedByMemberId: dto.proposedByMemberId,
        secondedByMemberId: dto.secondedByMemberId,
        voteRequired: dto.voteRequired !== false,
        status: 'PROPOSED',
      },
    });

    return motion;
  }

  async amendMotion(dto: AmendMotionDto) {
    const motion = await this.prisma.governanceMotion.findUnique({
      where: { id: dto.motionId },
      include: { amendments: true },
    });
    if (!motion) {
      throw new NotFoundException(`Motion with ID ${dto.motionId} not found`);
    }

    const nextAmendmentNumber = motion.amendments.length + 1;

    await this.prisma.motionAmendment.create({
      data: {
        motionId: dto.motionId,
        amendmentNumber: nextAmendmentNumber,
        proposedChange: dto.proposedChange,
        resultingText: dto.newMotionText,
        proposedByMemberId: dto.proposedByMemberId,
        decisionStatus: 'APPROVED',
      },
    });

    const updatedMotion = await this.prisma.governanceMotion.update({
      where: { id: dto.motionId },
      data: {
        text: dto.newMotionText,
        status: 'AMENDED',
      },
      include: { amendments: true },
    });

    return updatedMotion;
  }
}
