import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class RfqRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RequestForQuotationCreateInput) {
    return this.prisma.requestForQuotation.create({
      data,
      include: {
        lines: { include: { uom: true, inventoryItem: true } },
        invitations: { include: { vendor: true, vendorContact: true } },
        quotations: { include: { lines: true, vendor: true } },
      },
    });
  }

  async findById(id: string, organizationId?: string) {
    return this.prisma.requestForQuotation.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        lines: { include: { uom: true, inventoryItem: true } },
        invitations: { include: { vendor: true, vendorContact: true } },
        quotations: {
          include: {
            lines: { include: { uom: true } },
            vendor: true,
          },
        },
      },
    });
  }

  async findMany(params: {
    organizationId: string;
    communityId?: string;
    status?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { organizationId, communityId, status, search, skip = 0, take = 50 } = params;

    const where: Prisma.RequestForQuotationWhereInput = {
      organizationId,
      ...(communityId ? { communityId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { rfqNumber: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.requestForQuotation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          lines: { include: { uom: true } },
          invitations: { include: { vendor: true } },
          quotations: true,
        },
      }),
      this.prisma.requestForQuotation.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, organizationId: string, data: Prisma.RequestForQuotationUpdateInput) {
    return this.prisma.requestForQuotation.update({
      where: { id },
      data,
      include: {
        lines: { include: { uom: true, inventoryItem: true } },
        invitations: { include: { vendor: true } },
        quotations: true,
      },
    });
  }
}
