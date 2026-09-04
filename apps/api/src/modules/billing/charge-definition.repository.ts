import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, ChargeDefinition } from '@prisma/client';

@Injectable()
export class ChargeDefinitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ChargeDefinitionCreateInput): Promise<ChargeDefinition> {
    return this.prisma.chargeDefinition.create({ data });
  }

  async findById(id: string): Promise<ChargeDefinition | null> {
    return this.prisma.chargeDefinition.findUnique({ where: { id } });
  }

  async findByCode(organizationId: string, code: string): Promise<ChargeDefinition | null> {
    return this.prisma.chargeDefinition.findUnique({
      where: { organizationId_code: { organizationId, code } },
    });
  }

  async list(params: {
    organizationId: string;
    category?: any;
    isActive?: boolean;
  }): Promise<ChargeDefinition[]> {
    return this.prisma.chargeDefinition.findMany({
      where: {
        organizationId: params.organizationId,
        ...(params.category ? { category: params.category } : {}),
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      },
      orderBy: { code: 'asc' },
    });
  }
}
