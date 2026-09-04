import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { DecideVisitApprovalDto } from '@community-os/contracts';

@Injectable()
export class VisitApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async decideApproval(dto: DecideVisitApprovalDto, userId?: string) {
    const approval = await this.prisma.visitApproval.findUnique({
      where: { id: dto.approvalId },
      include: { visit: true },
    });
    if (!approval) throw new NotFoundException('Approval request not found.');

    const status = dto.approved ? 'APPROVED' : 'DENIED';
    const now = new Date();

    const updatedApproval = await this.prisma.visitApproval.update({
      where: { id: dto.approvalId },
      data: {
        status,
        decidedById: userId,
        decidedAt: now,
        decisionReason:
          dto.decisionReason || (dto.approved ? 'Resident approved' : 'Resident denied'),
      },
    });

    await this.prisma.visit.update({
      where: { id: approval.visitId },
      data: {
        status: dto.approved ? 'APPROVED' : 'DENIED',
        approvalStatus: status,
      },
    });

    return updatedApproval;
  }

  async getPendingApprovals(communityId: string) {
    return this.prisma.visitApproval.findMany({
      where: {
        status: 'PENDING',
        visit: { communityId },
      },
      include: {
        visit: {
          include: {
            visitor: true,
            destinationUnit: true,
            hostResident: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }
}
