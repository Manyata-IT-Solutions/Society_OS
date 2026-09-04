import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class SourcingAwardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SourcingAwardCreateInput) {
    return this.prisma.sourcingAward.create({
      data,
      include: {
        lines: { include: { quotation: true, quotationLine: true } },
        rfq: true,
        selectedVendor: true,
      },
    });
  }

  async findById(id: string, organizationId?: string) {
    return this.prisma.sourcingAward.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        lines: { include: { quotation: true, quotationLine: true } },
        rfq: { include: { lines: true } },
        selectedVendor: true,
      },
    });
  }

  async update(id: string, data: Prisma.SourcingAwardUpdateInput) {
    return this.prisma.sourcingAward.update({
      where: { id },
      data,
      include: {
        lines: true,
        rfq: true,
        selectedVendor: true,
      },
    });
  }
}
