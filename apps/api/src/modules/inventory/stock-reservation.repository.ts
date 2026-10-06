import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class StockReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.StockReservationCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    const client = tx ?? this.prisma;
    return client.stockReservation.create({
      data,
      include: {
        store: true,
        item: true,
        workOrder: true,
        batch: true,
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<any> {
    const client = tx ?? this.prisma;
    return client.stockReservation.findUnique({
      where: { id },
      include: {
        store: true,
        item: true,
        workOrder: true,
        batch: true,
      },
    });
  }

  async findByWorkOrderId(workOrderId: string): Promise<any[]> {
    return this.prisma.stockReservation.findMany({
      where: { workOrderId, status: 'ACTIVE' },
      include: {
        store: true,
        item: true,
        workOrder: true,
        batch: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.StockReservationUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    const client = tx ?? this.prisma;
    return client.stockReservation.update({
      where: { id },
      data,
      include: {
        store: true,
        item: true,
        workOrder: true,
        batch: true,
      },
    });
  }
}
