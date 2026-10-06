import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class InventoryIssueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.InventoryIssueCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    const client = tx ?? this.prisma;
    return client.inventoryIssue.create({
      data,
      include: {
        store: true,
        workOrder: true,
        issuedByUser: true,
        lines: {
          include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
        },
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<any> {
    const client = tx ?? this.prisma;
    return client.inventoryIssue.findUnique({
      where: { id },
      include: {
        store: true,
        workOrder: true,
        issuedByUser: true,
        lines: {
          include: { item: { include: { baseUom: true } }, uom: true, bin: true, batch: true },
        },
      },
    });
  }

  async findAll(params: {
    organizationId?: string;
    communityId?: string;
    storeId?: string;
    workOrderId?: string;
    status?: any;
    skip?: number;
    take?: number;
  }): Promise<{ issues: any[]; total: number }> {
    const where: Prisma.InventoryIssueWhereInput = {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.communityId ? { communityId: params.communityId } : {}),
      ...(params.storeId ? { storeId: params.storeId } : {}),
      ...(params.workOrderId ? { workOrderId: params.workOrderId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [issues, total] = await Promise.all([
      this.prisma.inventoryIssue.findMany({
        where,
        include: {
          store: true,
          workOrder: true,
          issuedByUser: true,
          lines: { include: { item: { include: { baseUom: true } }, uom: true, bin: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.inventoryIssue.count({ where }),
    ]);

    return { issues, total };
  }
}
