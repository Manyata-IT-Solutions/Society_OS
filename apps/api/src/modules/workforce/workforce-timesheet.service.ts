import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateTimesheetEntryDto } from '@community-os/contracts';

@Injectable()
export class WorkforceTimesheetService {
  constructor(private readonly prisma: PrismaService) {}

  async logTimesheet(dto: CreateTimesheetEntryDto, organizationId: string) {
    return this.prisma.workforceTimesheet.create({
      data: {
        organization: { connect: { id: organizationId } },
        worker: { connect: { id: dto.workerId } },
        date: new Date(dto.date),
        sourceType: dto.sourceType || 'WORK_ORDER',
        sourceReferenceId: dto.sourceReferenceId,
        workOrder:
          dto.sourceType === 'WORK_ORDER' && dto.sourceReferenceId
            ? { connect: { id: dto.sourceReferenceId } }
            : undefined,
        project:
          dto.sourceType === 'PROJECT' && dto.sourceReferenceId
            ? { connect: { id: dto.sourceReferenceId } }
            : undefined,
        durationMinutes: dto.durationMinutes,
        activityDescription: dto.activityDescription,
        status: 'APPROVED',
      },
    });
  }

  async getTimesheets(workerId?: string, organizationId?: string) {
    return this.prisma.workforceTimesheet.findMany({
      where: {
        ...(workerId ? { workerId } : {}),
        ...(organizationId ? { organizationId } : {}),
      },
      include: { worker: true, workOrder: true, project: true },
      orderBy: { date: 'desc' },
    });
  }
}
