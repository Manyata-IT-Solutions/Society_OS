import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SafetySequenceService } from './safety-sequence.service.js';
import { ReportSafetyHazardDto, AssessSafetyRiskDto } from '@community-os/contracts';

@Injectable()
export class HazardRiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SafetySequenceService,
  ) {}

  async reportHazard(dto: ReportSafetyHazardDto) {
    const hazardNumber = await this.sequence.getNextHazardNumber(dto.communityId);

    return this.prisma.safetyHazard.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        hazardNumber,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        locationDetails: dto.locationDetails,
        severity: dto.severity || 'MAJOR',
        status: 'REPORTED',
      },
    });
  }

  async assessRisk(dto: AssessSafetyRiskDto) {
    const riskNumber = await this.sequence.getNextRiskNumber(dto.communityId);

    // 5x5 Matrix calculation: Likelihood (1-5) * Impact (1-5)
    const likelihoodWeight: Record<string, number> = {
      RARE: 1,
      UNLIKELY: 2,
      POSSIBLE: 3,
      LIKELY: 4,
      ALMOST_CERTAIN: 5,
    };
    const impactWeight: Record<string, number> = {
      INSIGNIFICANT: 1,
      MINOR: 2,
      MODERATE: 3,
      MAJOR: 4,
      CATASTROPHIC: 5,
    };

    const lVal = likelihoodWeight[dto.likelihood] || 3;
    const iVal = impactWeight[dto.impact] || 3;
    const inherentScore = lVal * iVal;

    let resScore: number | null = null;
    if (dto.residualLikelihood && dto.residualImpact) {
      const rlVal = likelihoodWeight[dto.residualLikelihood] || 2;
      const riVal = impactWeight[dto.residualImpact] || 2;
      resScore = rlVal * riVal;
    }

    return this.prisma.safetyRisk.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        riskNumber,
        title: dto.title,
        description: dto.description,
        category: dto.category as any,
        likelihood: dto.likelihood,
        impact: dto.impact,
        inherentRiskScore: inherentScore,
        residualLikelihood: dto.residualLikelihood,
        residualImpact: dto.residualImpact,
        residualRiskScore: resScore,
        ownerId: dto.ownerId,
        status: 'ASSESSED',
      },
      include: { controls: true },
    });
  }

  async listRisks(communityId: string) {
    return this.prisma.safetyRisk.findMany({
      where: { communityId },
      include: { controls: true },
      orderBy: { inherentRiskScore: 'desc' },
    });
  }
}
