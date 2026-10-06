import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SafetySequenceService } from './safety-sequence.service.js';
import { CreateSafetyPermitDto, ApproveSafetyPermitDto } from '@community-os/contracts';

@Injectable()
export class SafetyPermitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SafetySequenceService,
  ) {}

  async createPermit(dto: CreateSafetyPermitDto) {
    const permitNumber = await this.sequence.getNextPermitNumber(dto.communityId);

    return this.prisma.safetyPermitToWork.create({
      data: {
        communityId: dto.communityId,
        permitNumber,
        permitType: dto.permitType,
        location: dto.location,
        hazards: dto.hazards,
        controls: dto.controls,
        validFrom: new Date(dto.validFrom),
        validTo: new Date(dto.validTo),
        receiverWorkerId: dto.receiverWorkerId,
        status: 'REQUESTED',
      },
    });
  }

  async approvePermit(dto: ApproveSafetyPermitDto, approverWorkerId?: string) {
    const permit = await this.prisma.safetyPermitToWork.findUnique({
      where: { id: dto.permitId },
    });
    if (!permit) throw new NotFoundException('Permit not found');

    return this.prisma.safetyPermitToWork.update({
      where: { id: dto.permitId },
      data: {
        status: dto.approved ? 'APPROVED' : 'CANCELLED',
        approvedAt: dto.approved ? new Date() : undefined,
        issuerWorkerId: approverWorkerId,
      },
    });
  }
}
