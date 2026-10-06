import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { GovernanceSequenceService } from './governance-sequence.service.js';
import {
  CreateGovernancePolicyDto,
  RevisePolicyDto,
  AcknowledgePolicyDto,
} from '@community-os/contracts';

@Injectable()
export class GovernancePolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: GovernanceSequenceService,
  ) {}

  async createPolicy(dto: CreateGovernancePolicyDto, approvedById?: string) {
    const policyNumber = await this.sequence.getNextPolicyNumber(dto.communityId);

    const policy = await this.prisma.governancePolicy.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        policyNumber,
        title: dto.title,
        category: dto.category || 'GENERAL',
        description: dto.description,
        status: 'EFFECTIVE',
        versions: {
          create: {
            versionNumber: 1,
            content: dto.content,
            effectiveFrom: new Date(dto.effectiveFrom),
            effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
            status: 'EFFECTIVE',
            resolutionId: dto.resolutionId,
            approvedById,
            approvedAt: new Date(),
            publishedAt: new Date(),
          },
        },
      },
      include: { versions: true },
    });

    return policy;
  }

  async revisePolicy(dto: RevisePolicyDto, approvedById?: string) {
    const policy = await this.prisma.governancePolicy.findUnique({
      where: { id: dto.policyId },
      include: { versions: { orderBy: { versionNumber: 'desc' } } },
    });
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${dto.policyId} not found`);
    }

    const nextVersion = (policy.versions[0]?.versionNumber || 0) + 1;

    // Supersede previous versions
    await this.prisma.governancePolicyVersion.updateMany({
      where: { policyId: dto.policyId, status: 'EFFECTIVE' },
      data: { status: 'SUPERSEDED' },
    });

    const newVersion = await this.prisma.governancePolicyVersion.create({
      data: {
        policyId: dto.policyId,
        versionNumber: nextVersion,
        content: dto.content,
        effectiveFrom: new Date(dto.effectiveFrom),
        changeSummary: dto.changeSummary,
        status: 'EFFECTIVE',
        resolutionId: dto.resolutionId,
        approvedById,
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
    });

    return newVersion;
  }

  async resolveEffectivePolicy(policyId: string, asOfDate: Date = new Date()) {
    const version = await this.prisma.governancePolicyVersion.findFirst({
      where: {
        policyId,
        effectiveFrom: { lte: asOfDate },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: asOfDate } }],
      },
      orderBy: { versionNumber: 'desc' },
    });
    return version;
  }

  async acknowledgePolicy(dto: AcknowledgePolicyDto) {
    const existing = await this.prisma.policyAcknowledgement.findUnique({
      where: {
        policyVersionId_residentId: {
          policyVersionId: dto.policyVersionId,
          residentId: dto.residentId,
        },
      },
    });
    if (existing) return existing;

    const ack = await this.prisma.policyAcknowledgement.create({
      data: {
        policyVersionId: dto.policyVersionId,
        residentId: dto.residentId,
        acknowledgedAt: new Date(),
      },
    });

    return ack;
  }

  async listPolicies(communityId: string) {
    return this.prisma.governancePolicy.findMany({
      where: { communityId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: { acknowledgements: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
