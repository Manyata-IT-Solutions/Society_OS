import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateGovernanceActionItemDto } from '@community-os/contracts';

@Injectable()
export class GovernanceActionItemService {
  constructor(private readonly prisma: PrismaService) {}

  async createActionItem(dto: CreateGovernanceActionItemDto) {
    const item = await this.prisma.governanceActionItem.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        meetingId: dto.meetingId,
        resolutionId: dto.resolutionId,
        title: dto.title,
        description: dto.description,
        ownerType: dto.ownerType || 'USER',
        ownerUserId: dto.ownerUserId,
        ownerWorkerId: dto.ownerWorkerId,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
        linkedDomainType: dto.linkedDomainType,
        linkedDomainId: dto.linkedDomainId,
      },
    });

    return item;
  }

  async completeActionItem(id: string) {
    const item = await this.prisma.governanceActionItem.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    return item;
  }

  async listActionItems(communityId: string, status?: string) {
    const where: any = { communityId };
    if (status) where.status = status;

    return this.prisma.governanceActionItem.findMany({
      where,
      include: {
        ownerUser: true,
        ownerWorker: true,
        meeting: true,
        resolution: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
