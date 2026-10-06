import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, BillableAccount } from '@prisma/client';

@Injectable()
export class BillableAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BillableAccountCreateInput): Promise<BillableAccount> {
    return this.prisma.billableAccount.create({
      data,
      include: { unit: true, residentAccount: true },
    });
  }

  async findById(id: string): Promise<BillableAccount | null> {
    return this.prisma.billableAccount.findUnique({
      where: { id },
      include: {
        unit: { include: { building: true, floor: true } },
        household: true,
        resident: true,
        residentAccount: { include: { outstanding: true } },
      },
    });
  }

  async findByAccountNumber(
    communityId: string,
    accountNumber: string,
  ): Promise<BillableAccount | null> {
    return this.prisma.billableAccount.findUnique({
      where: { communityId_accountNumber: { communityId, accountNumber } },
      include: { unit: true, residentAccount: true },
    });
  }

  async findByUnitId(unitId: string): Promise<BillableAccount | null> {
    return this.prisma.billableAccount.findFirst({
      where: { unitId, status: 'ACTIVE' },
      include: { unit: true, residentAccount: true },
    });
  }

  async list(params: {
    communityId: string;
    accountType?: any;
    status?: any;
    unitId?: string;
    skip?: number;
    take?: number;
  }): Promise<[BillableAccount[], number]> {
    const where: Prisma.BillableAccountWhereInput = {
      communityId: params.communityId,
      ...(params.accountType ? { accountType: params.accountType } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.unitId ? { unitId: params.unitId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.billableAccount.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { accountNumber: 'asc' },
        include: { unit: true, residentAccount: { include: { outstanding: true } } },
      }),
      this.prisma.billableAccount.count({ where }),
    ]);

    return [items, total];
  }

  async update(id: string, data: Prisma.BillableAccountUpdateInput): Promise<BillableAccount> {
    return this.prisma.billableAccount.update({
      where: { id },
      data,
      include: { unit: true, residentAccount: true },
    });
  }
}
