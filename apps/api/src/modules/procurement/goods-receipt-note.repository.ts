import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class GoodsReceiptNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.GoodsReceiptNoteCreateInput) {
    return this.prisma.goodsReceiptNote.create({
      data,
      include: {
        lines: { include: { uom: true, poLine: true, bin: true } },
        purchaseOrder: true,
        vendor: true,
        store: true,
        receivedByUser: true,
        inspectedByUser: true,
      },
    });
  }

  async findById(id: string, organizationId?: string) {
    return this.prisma.goodsReceiptNote.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        lines: { include: { uom: true, poLine: { include: { inventoryItem: true } }, bin: true } },
        purchaseOrder: { include: { lines: true } },
        vendor: true,
        store: true,
        receivedByUser: true,
        inspectedByUser: true,
      },
    });
  }

  async findMany(params: {
    organizationId: string;
    communityId?: string;
    purchaseOrderId?: string;
    vendorId?: string;
    storeId?: string;
    status?: any;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const {
      organizationId,
      communityId,
      purchaseOrderId,
      vendorId,
      storeId,
      status,
      search,
      skip = 0,
      take = 50,
    } = params;

    const where: Prisma.GoodsReceiptNoteWhereInput = {
      organizationId,
      ...(communityId ? { communityId } : {}),
      ...(purchaseOrderId ? { purchaseOrderId } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(storeId ? { storeId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { grnNumber: { contains: search, mode: 'insensitive' } },
              { deliveryChallanNumber: { contains: search, mode: 'insensitive' } },
              { vendorInvoiceReference: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.goodsReceiptNote.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          lines: { include: { uom: true } },
          purchaseOrder: true,
          vendor: true,
          store: true,
        },
      }),
      this.prisma.goodsReceiptNote.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, data: Prisma.GoodsReceiptNoteUpdateInput) {
    return this.prisma.goodsReceiptNote.update({
      where: { id },
      data,
      include: {
        lines: { include: { uom: true, poLine: { include: { inventoryItem: true } }, bin: true } },
        purchaseOrder: true,
        vendor: true,
        store: true,
      },
    });
  }
}
