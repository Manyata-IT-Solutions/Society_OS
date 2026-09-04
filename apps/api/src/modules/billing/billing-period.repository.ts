import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, BillingPeriod } from '@prisma/client';

@Injectable()
export class BillingPeriodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BillingPeriodCreateInput): Promise<BillingPeriod> {
    return this.prisma.billingPeriod.create({ data });
  }

  async findById(id: string): Promise<BillingPeriod | null> {
    return this.prisma.billingPeriod.findUnique({ where: { id } });
  }

  async findByCode(communityId: string, code: string): Promise<BillingPeriod | null> {
    return this.prisma.billingPeriod.findUnique({
      where: { communityId_code: { communityId, code } },
    });
  }

  async list(params: { communityId: string; status?: any }): Promise<BillingPeriod[]> {
    return this.prisma.billingPeriod.findMany({
      where: {
        communityId: params.communityId,
        ...(params.status ? { status: params.status } : {}),
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(id: string, data: Prisma.BillingPeriodUpdateInput): Promise<BillingPeriod> {
    return this.prisma.billingPeriod.update({ where: { id }, data });
  }
}
