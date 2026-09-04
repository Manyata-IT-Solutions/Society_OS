import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ReportUtilityOutageDto, RestoreUtilityOutageDto } from '@community-os/contracts';

@Injectable()
export class UtilityOutageService {
  constructor(private readonly prisma: PrismaService) {}

  async reportOutage(dto: ReportUtilityOutageDto) {
    return this.prisma.utilityOutage.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        utilityServiceId: dto.utilityServiceId,
        outageType: dto.outageType as any,
        title: dto.title,
        description: dto.description,
        startAt: new Date(dto.startAt),
        affectedScope: dto.affectedScope,
        linkedNoticeId: dto.noticeId,
        status: 'IN_PROGRESS',
      },
    });
  }

  async restoreOutage(dto: RestoreUtilityOutageDto) {
    const outage = await this.prisma.utilityOutage.findUnique({
      where: { id: dto.outageId },
    });
    if (!outage) throw new NotFoundException('Outage record not found');

    return this.prisma.utilityOutage.update({
      where: { id: dto.outageId },
      data: {
        status: 'RESTORED',
        endAt: new Date(dto.restoredAt),
        description: dto.resolutionNotes
          ? `${outage.description || ''} (Resolved: ${dto.resolutionNotes})`
          : undefined,
      },
    });
  }

  async listOutages(communityId: string) {
    return this.prisma.utilityOutage.findMany({
      where: { communityId },
      include: { utilityService: true },
      orderBy: { startAt: 'desc' },
    });
  }
}
