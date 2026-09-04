import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountingEntityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AccountingEntityCreateInput) {
    return this.prisma.accountingEntity.create({ data });
  }

  async findById(id: string) {
    return this.prisma.accountingEntity.findUnique({
      where: { id },
      include: {
        organization: true,
        community: true,
        fiscalCalendars: true,
      },
    });
  }

  async findByCode(organizationId: string, code: string) {
    return this.prisma.accountingEntity.findUnique({
      where: { organizationId_code: { organizationId, code } },
    });
  }

  async findMany(params: { organizationId: string; communityId?: string }) {
    const where: Prisma.AccountingEntityWhereInput = {
      organizationId: params.organizationId,
    };
    if (params.communityId) {
      where.communityId = params.communityId;
    }
    return this.prisma.accountingEntity.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, data: Prisma.AccountingEntityUpdateInput) {
    return this.prisma.accountingEntity.update({
      where: { id },
      data,
    });
  }
}
