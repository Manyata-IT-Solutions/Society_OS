import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateEngagementDto } from '@community-os/contracts';

@Injectable()
export class WorkerEngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createEngagement(dto: CreateEngagementDto) {
    return this.prisma.workerEngagement.create({
      data: {
        worker: { connect: { id: dto.workerId } },
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        vendor: dto.vendorId ? { connect: { id: dto.vendorId } } : undefined,
        engagementType: dto.engagementType || 'DIRECT_EMPLOYMENT',
        employmentReference: dto.employmentReference,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
        jobRole: dto.jobRoleId ? { connect: { id: dto.jobRoleId } } : undefined,
        managerWorkerId: dto.managerWorkerId,
        status: 'ACTIVE',
      },
    });
  }

  async getEngagements(workerId: string) {
    return this.prisma.workerEngagement.findMany({
      where: { workerId },
      include: { department: true, jobRole: true, vendor: true },
      orderBy: { startDate: 'desc' },
    });
  }
}
