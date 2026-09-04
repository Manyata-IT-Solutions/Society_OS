import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, Invoice } from '@prisma/client';

@Injectable()
export class InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return this.prisma.invoice.create({
      data,
      include: {
        billableAccount: { include: { unit: true } },
        billingPeriod: true,
        lines: {
          include: { chargeDefinition: true, fund: true, costCenter: true },
          orderBy: { lineNumber: 'asc' },
        },
      },
    });
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        billableAccount: { include: { unit: true, residentAccount: true } },
        billingPeriod: true,
        lines: {
          include: { chargeDefinition: true, fund: true, costCenter: true },
          orderBy: { lineNumber: 'asc' },
        },
        paymentAllocations: { include: { payment: true } },
        waiverRequests: true,
        creditNotes: true,
      },
    });
  }

  async findByInvoiceNumber(communityId: string, invoiceNumber: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { communityId_invoiceNumber: { communityId, invoiceNumber } },
      include: {
        billableAccount: { include: { unit: true } },
        billingPeriod: true,
        lines: { include: { chargeDefinition: true } },
      },
    });
  }

  async list(params: {
    communityId: string;
    billableAccountId?: string;
    billingPeriodId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<[Invoice[], number]> {
    const where: Prisma.InvoiceWhereInput = {
      communityId: params.communityId,
      ...(params.billableAccountId ? { billableAccountId: params.billableAccountId } : {}),
      ...(params.billingPeriodId ? { billingPeriodId: params.billingPeriodId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { invoiceDate: 'desc' },
        include: {
          billableAccount: { include: { unit: true } },
          billingPeriod: true,
          lines: { include: { chargeDefinition: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return [items, total];
  }

  async update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: {
        billableAccount: { include: { unit: true } },
        billingPeriod: true,
        lines: { include: { chargeDefinition: true } },
      },
    });
  }
}
