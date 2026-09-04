import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  Prisma,
  WorkOrderMaterialRequirement,
  WorkOrderMaterialConsumption,
} from '@prisma/client';

@Injectable()
export class WorkOrderMaterialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRequirement(
    data: Prisma.WorkOrderMaterialRequirementCreateInput,
  ): Promise<WorkOrderMaterialRequirement> {
    return this.prisma.workOrderMaterialRequirement.create({
      data,
      include: {
        item: { include: { baseUom: true } },
        uom: true,
        requestedByUser: true,
      },
    });
  }

  async findRequirementsByWorkOrder(workOrderId: string): Promise<WorkOrderMaterialRequirement[]> {
    return this.prisma.workOrderMaterialRequirement.findMany({
      where: { workOrderId },
      include: {
        item: { include: { baseUom: true } },
        uom: true,
        requestedByUser: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createConsumption(
    data: Prisma.WorkOrderMaterialConsumptionCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<WorkOrderMaterialConsumption> {
    const client = tx ?? this.prisma;
    return client.workOrderMaterialConsumption.create({
      data,
      include: {
        item: { include: { baseUom: true } },
        uom: true,
        asset: true,
        batch: true,
        serial: true,
        recordedByUser: true,
      },
    });
  }

  async findConsumptionsByWorkOrder(workOrderId: string): Promise<WorkOrderMaterialConsumption[]> {
    return this.prisma.workOrderMaterialConsumption.findMany({
      where: { workOrderId },
      include: {
        item: { include: { baseUom: true } },
        uom: true,
        asset: true,
        batch: true,
        serial: true,
        recordedByUser: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }
}
