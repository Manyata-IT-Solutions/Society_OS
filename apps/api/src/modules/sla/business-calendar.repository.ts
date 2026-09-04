import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, BusinessCalendar } from '@prisma/client';

@Injectable()
export class BusinessCalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BusinessCalendar | null> {
    return this.prisma.businessCalendar.findUnique({
      where: { id },
    });
  }

  async findByKey(
    organizationId: string | null | undefined,
    communityId: string | null | undefined,
    key: string,
  ): Promise<BusinessCalendar | null> {
    return this.prisma.businessCalendar.findFirst({
      where: {
        key,
        OR: [
          { organizationId: organizationId ?? null, communityId: communityId ?? null },
          { organizationId: organizationId ?? null, communityId: null },
          { organizationId: null, communityId: null },
        ],
      },
      orderBy: [{ communityId: 'desc' }, { organizationId: 'desc' }],
    });
  }

  async findDefault(
    organizationId?: string | null,
    communityId?: string | null,
  ): Promise<BusinessCalendar | null> {
    return this.prisma.businessCalendar.findFirst({
      where: {
        isDefault: true,
        OR: [
          { organizationId: organizationId ?? null, communityId: communityId ?? null },
          { organizationId: organizationId ?? null, communityId: null },
          { organizationId: null, communityId: null },
        ],
      },
      orderBy: [{ communityId: 'desc' }, { organizationId: 'desc' }],
    });
  }

  async list(params: {
    organizationId?: string | null;
    communityId?: string | null;
    skip?: number;
    take?: number;
  }): Promise<{ items: BusinessCalendar[]; total: number }> {
    const where: Prisma.BusinessCalendarWhereInput = {};
    if (params.organizationId !== undefined) {
      where.organizationId = params.organizationId;
    }
    if (params.communityId !== undefined) {
      where.communityId = params.communityId;
    }

    const [items, total] = await Promise.all([
      this.prisma.businessCalendar.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { name: 'asc' },
      }),
      this.prisma.businessCalendar.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: Prisma.BusinessCalendarCreateInput): Promise<BusinessCalendar> {
    return this.prisma.businessCalendar.create({ data });
  }

  async update(id: string, data: Prisma.BusinessCalendarUpdateInput): Promise<BusinessCalendar> {
    return this.prisma.businessCalendar.update({
      where: { id },
      data,
    });
  }
}
