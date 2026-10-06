import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class FundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.FundCreateInput) {
    return this.prisma.fund.create({ data });
  }

  async findById(id: string) {
    return this.prisma.fund.findUnique({ where: { id } });
  }

  async findByCode(accountingEntityId: string, code: string) {
    return this.prisma.fund.findUnique({
      where: {
        accountingEntityId_code: {
          accountingEntityId,
          code,
        },
      },
    });
  }

  async findMany(accountingEntityId: string) {
    return this.prisma.fund.findMany({
      where: { accountingEntityId },
      orderBy: { code: 'asc' },
    });
  }

  async update(id: string, data: Prisma.FundUpdateInput) {
    return this.prisma.fund.update({
      where: { id },
      data,
    });
  }
}
