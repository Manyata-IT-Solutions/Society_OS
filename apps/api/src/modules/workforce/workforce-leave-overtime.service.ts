import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateLeaveRequestDto,
  DecideLeaveRequestDto,
  CreateOvertimeRecordDto,
} from '@community-os/contracts';

@Injectable()
export class WorkforceLeaveOvertimeService {
  constructor(private readonly prisma: PrismaService) {}

  async createLeaveRequest(dto: CreateLeaveRequestDto, organizationId: string) {
    return this.prisma.leaveRequest.create({
      data: {
        organization: { connect: { id: organizationId } },
        community: dto.communityId ? { connect: { id: dto.communityId } } : undefined,
        worker: { connect: { id: dto.workerId } },
        leaveType: dto.leaveType || 'CASUAL',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: 'SUBMITTED',
      },
    });
  }

  async decideLeaveRequest(dto: DecideLeaveRequestDto, userId?: string) {
    return this.prisma.leaveRequest.update({
      where: { id: dto.leaveRequestId },
      data: {
        status: dto.approved ? 'APPROVED' : 'REJECTED',
        approvedBy: userId ? { connect: { id: userId } } : undefined,
        decidedAt: new Date(),
      },
    });
  }

  async getLeaveRequests(organizationId: string, workerId?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        ...(workerId ? { workerId } : {}),
      },
      include: { worker: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async recordOvertime(dto: CreateOvertimeRecordDto, organizationId: string) {
    return this.prisma.overtimeRecord.create({
      data: {
        organization: { connect: { id: organizationId } },
        worker: { connect: { id: dto.workerId } },
        shiftInstance: dto.shiftInstanceId ? { connect: { id: dto.shiftInstanceId } } : undefined,
        date: new Date(dto.date),
        requestedMinutes: dto.requestedMinutes,
        approvedMinutes: dto.requestedMinutes,
        reason: dto.reason,
        status: 'APPROVED',
      },
    });
  }

  async getOvertimeRecords(organizationId: string) {
    return this.prisma.overtimeRecord.findMany({
      where: { organizationId },
      include: { worker: true },
      orderBy: { date: 'desc' },
    });
  }
}
