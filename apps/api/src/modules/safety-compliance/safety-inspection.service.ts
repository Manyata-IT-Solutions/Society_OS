import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SafetySequenceService } from './safety-sequence.service.js';
import { CreateSafetyInspectionDto, RecordInspectionFindingDto } from '@community-os/contracts';

@Injectable()
export class SafetyInspectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SafetySequenceService,
  ) {}

  async createInspection(dto: CreateSafetyInspectionDto) {
    const inspectionNumber = await this.sequence.getNextInspectionNumber(dto.communityId);

    return this.prisma.safetyInspection.create({
      data: {
        communityId: dto.communityId,
        inspectionNumber,
        inspectionType: dto.inspectionType,
        scope: dto.scope,
        scheduledAt: new Date(dto.scheduledAt),
        inspectorId: dto.inspectorId,
        status: 'SCHEDULED',
      },
    });
  }

  async recordFinding(dto: RecordInspectionFindingDto) {
    let correctiveActionId: string | undefined;

    if (dto.createCorrectiveAction) {
      const capa = await this.prisma.safetyCorrectiveAction.create({
        data: {
          sourceType: 'INSPECTION',
          sourceId: dto.inspectionId,
          title: `Remediate inspection finding: ${dto.itemDescription}`,
          description: dto.description,
          dueDate: new Date(Date.now() + 14 * 86400000), // 14 days
          priority: dto.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
          status: 'OPEN',
        },
      });
      correctiveActionId = capa.id;
    }

    return this.prisma.safetyFinding.create({
      data: {
        inspectionId: dto.inspectionId,
        itemDescription: dto.itemDescription,
        severity: dto.severity,
        description: dto.description,
        correctiveActionId,
        status: 'OPEN',
      },
    });
  }
}
