import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PaymentTerms } from '@prisma/client';

@Injectable()
export class PaymentTermsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<PaymentTerms> {
    return this.prisma.paymentTerms.create({
      data: {
        organization: { connect: { id: data.organizationId } },
        code: data.code,
        name: data.name,
        days: data.days || 30,
        calculationRule: data.calculationRule || 'FROM_INVOICE_DATE',
        description: data.description,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async list(organizationId: string): Promise<PaymentTerms[]> {
    return this.prisma.paymentTerms.findMany({
      where: { organizationId },
      orderBy: { days: 'asc' },
    });
  }

  async findById(id: string): Promise<PaymentTerms | null> {
    return this.prisma.paymentTerms.findUnique({ where: { id } });
  }
}
