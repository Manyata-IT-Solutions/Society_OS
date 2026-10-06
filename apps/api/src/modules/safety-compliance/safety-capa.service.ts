import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateSafetyCorrectiveActionDto,
  VerifyCorrectiveActionDto,
} from '@community-os/contracts';

@Injectable()
export class SafetyCAPAService {
  constructor(private readonly prisma: PrismaService) {}

  async createCAPA(dto: CreateSafetyCorrectiveActionDto) {
    return this.prisma.safetyCorrectiveAction.create({
      data: {
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        title: dto.title,
        description: dto.description,
        ownerId: dto.ownerId,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || 'HIGH',
        verificationRequired: dto.verificationRequired !== false,
        linkedWorkOrderId: dto.linkedWorkOrderId,
        status: 'OPEN',
      },
    });
  }

  async verifyCAPA(dto: VerifyCorrectiveActionDto, verifierId?: string) {
    const action = await this.prisma.safetyCorrectiveAction.findUnique({
      where: { id: dto.actionId },
    });
    if (!action) throw new NotFoundException('Corrective action not found');

    const isVerified = dto.verificationOutcome === 'VERIFIED';

    return this.prisma.safetyCorrectiveAction.update({
      where: { id: dto.actionId },
      data: {
        status: isVerified ? 'VERIFIED' : 'OPEN',
        verifiedAt: new Date(),
        verifiedById: verifierId,
        verificationOutcome: dto.verificationOutcome,
        verificationNotes: dto.verificationNotes,
      },
    });
  }

  async listCAPA(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.safetyCorrectiveAction.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }
}
