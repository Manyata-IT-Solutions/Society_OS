import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class VendorQuotationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.VendorQuotationCreateInput) {
    return this.prisma.vendorQuotation.create({
      data,
      include: {
        lines: { include: { uom: true } },
        vendor: true,
        rfq: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.vendorQuotation.findUnique({
      where: { id },
      include: {
        lines: { include: { uom: true, rfqLine: true } },
        vendor: true,
        rfq: true,
      },
    });
  }

  async findByRfq(rfqId: string) {
    return this.prisma.vendorQuotation.findMany({
      where: { rfqId, isCurrentRevision: true },
      include: {
        lines: { include: { uom: true, rfqLine: true } },
        vendor: true,
      },
      orderBy: { grandTotal: 'asc' },
    });
  }

  async update(id: string, data: Prisma.VendorQuotationUpdateInput) {
    return this.prisma.vendorQuotation.update({
      where: { id },
      data,
      include: {
        lines: { include: { uom: true } },
        vendor: true,
      },
    });
  }
}
