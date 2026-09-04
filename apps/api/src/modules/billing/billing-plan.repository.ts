import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, BillingPlan } from '@prisma/client';

@Injectable()
export class BillingPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BillingPlanCreateInput): Promise<BillingPlan> {
    return this.prisma.billingPlan.create({
      data,
      include: {
        chargeRules: { include: { chargeDefinition: true, fund: true, costCenter: true } },
      },
    });
  }

  async findById(id: string): Promise<BillingPlan | null> {
    return this.prisma.billingPlan.findUnique({
      where: { id },
      include: {
        chargeRules: {
          include: { chargeDefinition: true, fund: true, costCenter: true },
          orderBy: { priority: 'asc' },
        },
      },
    });
  }

  async findByCode(communityId: string, code: string): Promise<BillingPlan | null> {
    return this.prisma.billingPlan.findUnique({
      where: { communityId_code: { communityId, code } },
      include: {
        chargeRules: { include: { chargeDefinition: true, fund: true, costCenter: true } },
      },
    });
  }

  async list(params: { communityId: string; isActive?: boolean }): Promise<BillingPlan[]> {
    return this.prisma.billingPlan.findMany({
      where: {
        communityId: params.communityId,
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      },
      include: {
        chargeRules: {
          include: { chargeDefinition: true, fund: true, costCenter: true },
          orderBy: { priority: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    });
  }
}
