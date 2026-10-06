import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateComplianceRequirementDto,
  CreateComplianceObligationDto,
} from '@community-os/contracts';

@Injectable()
export class ComplianceRequirementService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequirement(dto: CreateComplianceRequirementDto) {
    return this.prisma.complianceRequirement.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        authorityName: dto.authorityName,
        reviewFrequency: dto.reviewFrequency || 'ANNUAL',
        status: 'ACTIVE',
      },
    });
  }

  async createObligation(dto: CreateComplianceObligationDto) {
    return this.prisma.complianceObligation.create({
      data: {
        requirementId: dto.requirementId,
        title: dto.title,
        dueDate: new Date(dto.dueDate),
        ownerId: dto.ownerId,
        status: 'ACTION_REQUIRED',
      },
    });
  }

  async listRequirements(communityId: string) {
    return this.prisma.complianceRequirement.findMany({
      where: { communityId },
      include: { obligations: true, credentials: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
