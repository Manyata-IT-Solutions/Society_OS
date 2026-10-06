import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PurchaseOrderCreateInput) {
    return this.prisma.purchaseOrder.create({
      data,
      include: {
        lines: { include: { uom: true, inventoryItem: true } },
        vendor: true,
        revisions: true,
      },
    });
  }

  async findById(id: string, organizationId?: string) {
    return this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        lines: { include: { uom: true, inventoryItem: true } },
        vendor: true,
        revisions: true,
        goodsReceiptNotes: {
          include: { lines: true },
        },
        serviceReceipts: {
          include: { lines: true },
        },
      },
    });
  }

  async findMany(params: {
    organizationId: string;
    communityId?: string;
    vendorId?: string;
    status?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { organizationId, communityId, vendorId, status, search, skip = 0, take = 50 } = params;

    const where: Prisma.PurchaseOrderWhereInput = {
      organizationId,
      ...(communityId ? { communityId } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { poNumber: { contains: search, mode: 'insensitive' } },
              { vendor: { displayName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          lines: { include: { uom: true } },
          vendor: true,
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, data: Prisma.PurchaseOrderUpdateInput) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        lines: { include: { uom: true } },
        vendor: true,
        revisions: true,
      },
    });
  }
}
