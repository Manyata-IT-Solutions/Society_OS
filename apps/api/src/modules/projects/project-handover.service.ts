import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ProjectSequenceService } from './project-sequence.service.js';

@Injectable()
export class ProjectHandoverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceService: ProjectSequenceService,
  ) {}

  async initiateHandover(dto: any, actorId?: string) {
    // Check if there are blocking open snags
    const blockingSnags = await this.prisma.projectSnag.count({
      where: {
        projectId: dto.projectId,
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'READY_FOR_REVIEW'] },
        isBlockingHandover: true,
      },
    });

    if (blockingSnags > 0) {
      throw new BadRequestException(
        `Project Handover blocked: ${blockingSnags} critical/blocking snag(s) must be resolved before handover.`,
      );
    }

    const handoverNumber = await this.sequenceService.getNextHandoverNumber(dto.projectId);

    return this.prisma.projectHandover.create({
      data: {
        projectId: dto.projectId,
        handoverNumber,
        handoverDate: dto.handoverDate ? new Date(dto.handoverDate) : new Date(),
        handoverFrom: dto.handoverFrom,
        handoverTo: dto.handoverTo,
        status: 'COMPLETED',
        openSnagCount: blockingSnags,
        warrantyStartDate: dto.warrantyStartDate ? new Date(dto.warrantyStartDate) : new Date(),
        defectLiabilityStartDate: dto.defectLiabilityStartDate
          ? new Date(dto.defectLiabilityStartDate)
          : new Date(),
        defectLiabilityEndDate: dto.defectLiabilityEndDate
          ? new Date(dto.defectLiabilityEndDate)
          : new Date(Date.now() + 365 * 24 * 3600 * 1000),
        checklistCompleted: true,
        checklistData: dto.checklistData || [],
        notes: dto.notes,
        approvedById: actorId,
        approvedAt: new Date(),
      },
    });
  }

  async getHandovers(projectId: string) {
    return this.prisma.projectHandover.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
