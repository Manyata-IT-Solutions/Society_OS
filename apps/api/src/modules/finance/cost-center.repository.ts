import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CostCenterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CostCenterCreateInput) {
    return this.prisma.costCenter.create({ data });
  }

  async findById(id: string) {
    return this.prisma.costCenter.findUnique({
      where: { id },
      include: { parentCostCenter: true, childCostCenters: true },
    });
  }

  async findByCode(accountingEntityId: string, code: string) {
    return this.prisma.costCenter.findUnique({
      where: {
        accountingEntityId_code: {
          accountingEntityId,
          code,
        },
      },
    });
  }

  async findMany(accountingEntityId: string) {
    return this.prisma.costCenter.findMany({
      where: { accountingEntityId },
      orderBy: { code: 'asc' },
      include: { parentCostCenter: true },
    });
  }

  async update(id: string, data: Prisma.CostCenterUpdateInput) {
    return this.prisma.costCenter.update({
      where: { id },
      data,
    });
  }
}
