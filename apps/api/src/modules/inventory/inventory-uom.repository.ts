import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma, UnitOfMeasure } from '@prisma/client';

@Injectable()
export class InventoryUomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UnitOfMeasureCreateInput): Promise<UnitOfMeasure> {
    return this.prisma.unitOfMeasure.create({ data });
  }

  async findById(id: string): Promise<UnitOfMeasure | null> {
    return this.prisma.unitOfMeasure.findUnique({
      where: { id },
      include: { baseUom: true },
    });
  }

  async findByCode(organizationId: string, code: string): Promise<UnitOfMeasure | null> {
    return this.prisma.unitOfMeasure.findUnique({
      where: {
        organizationId_code: { organizationId, code },
      },
    });
  }

  async findAll(organizationId: string): Promise<UnitOfMeasure[]> {
    return this.prisma.unitOfMeasure.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
      include: { baseUom: true },
    });
  }

  async update(id: string, data: Prisma.UnitOfMeasureUpdateInput): Promise<UnitOfMeasure> {
    return this.prisma.unitOfMeasure.update({
      where: { id },
      data,
    });
  }
}
