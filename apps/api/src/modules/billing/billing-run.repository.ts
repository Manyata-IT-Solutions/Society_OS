import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, BillingRun } from '@prisma/client';

@Injectable()
export class BillingRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BillingRunCreateInput): Promise<BillingRun> {
    return this.prisma.billingRun.create({
      data,
      include: { billingPeriod: true, billingPlan: true },
    });
  }

  async findById(id: string): Promise<BillingRun | null> {
    return this.prisma.billingRun.findUnique({
      where: { id },
      include: { billingPeriod: true, billingPlan: true, invoices: true },
    });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<BillingRun | null> {
    return this.prisma.billingRun.findUnique({
      where: { idempotencyKey },
      include: { billingPeriod: true, billingPlan: true },
    });
  }

  async list(params: { communityId: string; billingPeriodId?: string }): Promise<BillingRun[]> {
    return this.prisma.billingRun.findMany({
      where: {
        communityId: params.communityId,
        ...(params.billingPeriodId ? { billingPeriodId: params.billingPeriodId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { billingPeriod: true, billingPlan: true },
    });
  }

  async update(id: string, data: Prisma.BillingRunUpdateInput): Promise<BillingRun> {
    return this.prisma.billingRun.update({
      where: { id },
      data,
      include: { billingPeriod: true, billingPlan: true },
    });
  }
}
