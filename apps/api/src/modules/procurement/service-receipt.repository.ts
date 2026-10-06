import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class ServiceReceiptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ServiceReceiptNoteCreateInput) {
    return this.prisma.serviceReceiptNote.create({
      data,
      include: {
        lines: true,
        purchaseOrder: true,
        vendor: true,
      },
    });
  }

  async findById(id: string, organizationId?: string) {
    return this.prisma.serviceReceiptNote.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        lines: true,
        purchaseOrder: { include: { lines: true } },
        vendor: true,
      },
    });
  }

  async update(id: string, data: Prisma.ServiceReceiptNoteUpdateInput) {
    return this.prisma.serviceReceiptNote.update({
      where: { id },
      data,
      include: {
        lines: true,
        purchaseOrder: true,
        vendor: true,
      },
    });
  }
}
