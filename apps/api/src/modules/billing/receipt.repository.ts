import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, Receipt } from '@prisma/client';

@Injectable()
export class ReceiptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ReceiptCreateInput): Promise<Receipt> {
    return this.prisma.receipt.create({
      data,
      include: {
        billableAccount: { include: { unit: true } },
        payment: true,
        document: true,
      },
    });
  }

  async findById(id: string): Promise<Receipt | null> {
    return this.prisma.receipt.findUnique({
      where: { id },
      include: {
        billableAccount: { include: { unit: true } },
        payment: { include: { paymentAllocations: { include: { invoice: true } } } },
        document: true,
      },
    });
  }

  async findByPaymentId(paymentId: string): Promise<Receipt | null> {
    return this.prisma.receipt.findFirst({
      where: { paymentId },
      include: {
        billableAccount: { include: { unit: true } },
        payment: true,
        document: true,
      },
    });
  }

  async list(params: {
    communityId: string;
    billableAccountId?: string;
    skip?: number;
    take?: number;
  }): Promise<[Receipt[], number]> {
    const where: Prisma.ReceiptWhereInput = {
      communityId: params.communityId,
      ...(params.billableAccountId ? { billableAccountId: params.billableAccountId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { receiptDate: 'desc' },
        include: {
          billableAccount: { include: { unit: true } },
          payment: true,
        },
      }),
      this.prisma.receipt.count({ where }),
    ]);

    return [items, total];
  }
}
