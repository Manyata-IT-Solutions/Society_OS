import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class WorkforceCapabilityResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveTechnicians(
    communityId: string,
    requiredTrade?: string,
    requiredSkillCode?: string,
  ) {
    const today = new Date();

    const workers = await this.prisma.worker.findMany({
      where: {
        status: 'ACTIVE',
        primaryCommunityId: communityId,
        engagements: {
          some: {
            status: 'ACTIVE',
            ...(requiredTrade ? { jobRole: { trade: requiredTrade } } : {}),
          },
        },
        ...(requiredSkillCode
          ? {
              skills: {
                some: {
                  skill: { code: requiredSkillCode },
                  verified: true,
                },
              },
            }
          : {}),
      },
      include: {
        skills: { include: { skill: true } },
        certifications: true,
        engagements: { include: { jobRole: true, department: true } },
      },
    });

    // Filter out workers with expired mandatory certifications
    return workers.filter((w) => {
      const hasExpiredCert = w.certifications.some(
        (c) => c.expiryDate && new Date(c.expiryDate) < today,
      );
      return !hasExpiredCert;
    });
  }
}
