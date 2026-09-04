import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseRequisitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PurchaseRequisitionCreateInput) {
    return this.prisma.purchaseRequisition.create({
      data,
      include: {
        lines: {
          include: {
            inventoryItem: true,
            uom: true,
          },
        },
        requestedByUser: true,
        targetStore: true,
      },
    });
  }

  async findById(id: string, organizationId?: string) {
    return this.prisma.purchaseRequisition.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        lines: {
          include: {
            inventoryItem: true,
            uom: true,
            workOrder: true,
            asset: true,
          },
        },
        requestedByUser: true,
        targetStore: true,
      },
    });
  }

  async findMany(params: {
    organizationId: string;
    communityId?: string;
    status?: any;
    requestType?: any;
    priority?: any;
    sourceType?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const {
      organizationId,
      communityId,
      status,
      requestType,
      priority,
      sourceType,
      search,
      skip = 0,
      take = 50,
    } = params;

    const where: Prisma.PurchaseRequisitionWhereInput = {
      organizationId,
      ...(communityId ? { communityId } : {}),
      ...(status ? { status } : {}),
      ...(requestType ? { requestType } : {}),
      ...(priority ? { priority } : {}),
      ...(sourceType ? { sourceType } : {}),
      ...(search
        ? {
            OR: [
              { requisitionNumber: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.purchaseRequisition.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          lines: {
            include: {
              inventoryItem: true,
              uom: true,
            },
          },
          requestedByUser: true,
          targetStore: true,
        },
      }),
      this.prisma.purchaseRequisition.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, organizationId: string, data: Prisma.PurchaseRequisitionUpdateInput) {
    return this.prisma.purchaseRequisition.update({
      where: { id },
      data,
      include: {
        lines: {
          include: {
            inventoryItem: true,
            uom: true,
          },
        },
        requestedByUser: true,
        targetStore: true,
      },
    });
  }
}
