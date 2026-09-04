import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateWorkforceTaskDto } from '@community-os/contracts';

@Injectable()
export class WorkforceTaskService {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(dto: CreateWorkforceTaskDto) {
    return this.prisma.workforceTask.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        title: dto.title,
        description: dto.description,
        assignedWorker: dto.assignedWorkerId
          ? { connect: { id: dto.assignedWorkerId } }
          : undefined,
        locationReference: dto.locationReference,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
        checklist: dto.checklist ? (dto.checklist as any) : [],
      },
    });
  }

  async completeTask(taskId: string) {
    return this.prisma.workforceTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED' },
    });
  }

  async getTasks(communityId: string, status?: string) {
    return this.prisma.workforceTask.findMany({
      where: {
        communityId,
        ...(status ? { status } : {}),
      },
      include: { assignedWorker: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
