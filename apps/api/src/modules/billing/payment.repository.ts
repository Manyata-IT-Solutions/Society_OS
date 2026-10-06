import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, Payment } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({
      data,
      include: {
        billableAccount: { include: { unit: true } },
        receipts: true,
        paymentAllocations: { include: { invoice: true } },
      },
    });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        billableAccount: { include: { unit: true, residentAccount: true } },
        receipts: true,
        paymentAllocations: { include: { invoice: true } },
      },
    });
  }

  async list(params: {
    communityId: string;
    billableAccountId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<[Payment[], number]> {
    const where: Prisma.PaymentWhereInput = {
      communityId: params.communityId,
      ...(params.billableAccountId ? { billableAccountId: params.billableAccountId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { paymentDate: 'desc' },
        include: {
          billableAccount: { include: { unit: true } },
          receipts: true,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return [items, total];
  }

  async update(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data,
      include: {
        billableAccount: { include: { unit: true } },
        receipts: true,
        paymentAllocations: { include: { invoice: true } },
      },
    });
  }
}
