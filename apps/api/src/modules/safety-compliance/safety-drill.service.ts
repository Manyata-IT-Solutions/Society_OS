import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SafetySequenceService } from './safety-sequence.service.js';
import { PlanSafetyDrillDto, CompleteSafetyDrillDto } from '@community-os/contracts';

@Injectable()
export class SafetyDrillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SafetySequenceService,
  ) {}

  async planDrill(dto: PlanSafetyDrillDto) {
    const drillNumber = await this.sequence.getNextDrillNumber(dto.communityId);

    return this.prisma.safetyDrill.create({
      data: {
        communityId: dto.communityId,
        drillNumber,
        drillType: dto.drillType,
        title: dto.title,
        scenario: dto.scenario,
        plannedDate: new Date(dto.plannedDate),
        status: 'PLANNED',
      },
    });
  }

  async completeDrill(dto: CompleteSafetyDrillDto) {
    const drill = await this.prisma.safetyDrill.findUnique({
      where: { id: dto.drillId },
    });
    if (!drill) throw new NotFoundException('Drill not found');

    return this.prisma.safetyDrill.update({
      where: { id: dto.drillId },
      data: {
        status: 'COMPLETED',
        conductedAt: new Date(),
        evacuationDurationMinutes: dto.evacuationDurationMinutes,
        musterCompletionPct: dto.musterCompletionPct,
        evaluationNotes: dto.evaluationNotes,
      },
    });
  }
}
