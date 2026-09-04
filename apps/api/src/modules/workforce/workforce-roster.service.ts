import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateRosterDto, AssignShiftDto, ShiftSwapRequestDto } from '@community-os/contracts';

@Injectable()
export class WorkforceRosterService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoster(dto: CreateRosterDto, userId?: string) {
    return this.prisma.workforceRoster.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        name: dto.name,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
        status: 'DRAFT',
        createdByUser: userId ? { connect: { id: userId } } : undefined,
      },
    });
  }

  async publishRoster(rosterId: string, userId?: string) {
    return this.prisma.workforceRoster.update({
      where: { id: rosterId },
      data: {
        status: 'PUBLISHED',
        approvedByUser: userId ? { connect: { id: userId } } : undefined,
      },
    });
  }

  async assignShift(dto: AssignShiftDto) {
    const shift = await this.prisma.shiftInstance.findUnique({
      where: { id: dto.shiftInstanceId },
    });
    if (!shift) throw new NotFoundException('Shift instance not found');

    return this.prisma.$transaction(async (tx) => {
      // Concurrency check: worker cannot be assigned to overlapping shifts
      const conflict = await tx.shiftAssignment.findFirst({
        where: {
          workerId: dto.workerId,
          status: 'CONFIRMED',
          shiftInstance: {
            startAt: { lt: shift.endAt },
            endAt: { gt: shift.startAt },
          },
        },
      });

      if (conflict) {
        throw new ConflictException('Worker is already assigned to an overlapping shift');
      }

      const assignment = await tx.shiftAssignment.create({
        data: {
          shiftInstance: { connect: { id: dto.shiftInstanceId } },
          worker: { connect: { id: dto.workerId } },
          assignmentRole: dto.assignmentRole,
          replacedAssignment: dto.replacementForAssignmentId
            ? { connect: { id: dto.replacementForAssignmentId } }
            : undefined,
          status: 'CONFIRMED',
        },
      });

      // Update shift instance status
      const totalAssignments = await tx.shiftAssignment.count({
        where: { shiftInstanceId: dto.shiftInstanceId, status: 'CONFIRMED' },
      });

      await tx.shiftInstance.update({
        where: { id: dto.shiftInstanceId },
        data: {
          status:
            totalAssignments >= shift.requiredHeadcount ? 'FULLY_STAFFED' : 'PARTIALLY_STAFFED',
        },
      });

      return assignment;
    });
  }

  async requestShiftSwap(dto: ShiftSwapRequestDto) {
    return this.prisma.shiftSwapRequest.create({
      data: {
        requesterAssignment: { connect: { id: dto.requesterAssignmentId } },
        targetAssignment: { connect: { id: dto.targetAssignmentId } },
        reason: dto.reason,
        status: 'PENDING',
      },
    });
  }

  async approveShiftSwap(swapId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const swap = await tx.shiftSwapRequest.findUnique({
        where: { id: swapId },
        include: { requesterAssignment: true, targetAssignment: true },
      });
      if (!swap) throw new NotFoundException('Shift swap request not found');

      // Swap the worker IDs between the two assignments
      const workerA = swap.requesterAssignment.workerId;
      const workerB = swap.targetAssignment.workerId;

      await tx.shiftAssignment.update({
        where: { id: swap.requesterAssignmentId },
        data: { workerId: workerB },
      });

      await tx.shiftAssignment.update({
        where: { id: swap.targetAssignmentId },
        data: { workerId: workerA },
      });

      return tx.shiftSwapRequest.update({
        where: { id: swapId },
        data: {
          status: 'APPROVED',
          approvedBy: userId ? { connect: { id: userId } } : undefined,
          decidedAt: new Date(),
        },
      });
    });
  }

  async getRosters(communityId: string) {
    return this.prisma.workforceRoster.findMany({
      where: { communityId },
      include: {
        department: true,
        assignments: { include: { worker: true, shiftInstance: true } },
      },
      orderBy: { periodStart: 'desc' },
    });
  }
}
