import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { UnitOwnership, OwnershipType, OwnershipStatus } from '@community-os/types';
import type { CreateOwnershipInput, OwnershipQueryParams } from '@community-os/validation';

export type OwnershipWithRelations = UnitOwnership & {
  resident?: {
    id: string;
    organizationId: string;
    communityId: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    status: string;
    phone: string | null;
    email: string | null;
    userId: string | null;
    createdAt: Date;
  };
  unit?: {
    id: string;
    unitNumber: string;
    displayName: string;
  };
};

@Injectable()
export class OwnershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OwnershipWithRelations | null> {
    const record = await this.prisma.unitOwnership.findUnique({
      where: { id },
      include: {
        resident: true,
        unit: { select: { id: true, unitNumber: true, displayName: true } },
      },
    });
    return (record as unknown as OwnershipWithRelations) || null;
  }

  async findActiveByUnitId(unitId: string): Promise<OwnershipWithRelations[]> {
    const records = await this.prisma.unitOwnership.findMany({
      where: {
        unitId,
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      include: {
        resident: true,
        unit: { select: { id: true, unitNumber: true, displayName: true } },
      },
      orderBy: { isPrimaryOwner: 'desc' },
    });
    return records as unknown as OwnershipWithRelations[];
  }

  async findByUnitId(
    unitId: string,
    params: OwnershipQueryParams,
  ): Promise<{ items: OwnershipWithRelations[]; total: number }> {
    const { page = 1, limit = 50, status, residentId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { unitId };
    if (status) where['status'] = status;
    if (residentId) where['residentId'] = residentId;

    const [total, records] = await Promise.all([
      this.prisma.unitOwnership.count({ where }),
      this.prisma.unitOwnership.findMany({
        where,
        skip,
        take: limit,
        include: {
          resident: true,
          unit: { select: { id: true, unitNumber: true, displayName: true } },
        },
        orderBy: [{ startDate: 'desc' }],
      }),
    ]);

    return {
      items: records as unknown as OwnershipWithRelations[],
      total,
    };
  }

  async findByResidentId(residentId: string): Promise<OwnershipWithRelations[]> {
    const records = await this.prisma.unitOwnership.findMany({
      where: { residentId },
      include: {
        resident: true,
        unit: { select: { id: true, unitNumber: true, displayName: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    return records as unknown as OwnershipWithRelations[];
  }

  async create(
    organizationId: string,
    communityId: string,
    input: CreateOwnershipInput,
  ): Promise<UnitOwnership> {
    const record = await this.prisma.unitOwnership.create({
      data: {
        organizationId,
        communityId,
        unitId: input.unitId,
        residentId: input.residentId,
        ownershipShare: input.ownershipShare ?? null,
        ownershipType: (input.ownershipType || 'SOLE') as OwnershipType,
        isPrimaryOwner: input.isPrimaryOwner ?? true,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: 'ACTIVE',
        version: 1,
      },
    });
    return record as unknown as UnitOwnership;
  }

  async endOwnership(
    id: string,
    endDate: Date,
    status: OwnershipStatus = 'TRANSFERRED',
  ): Promise<void> {
    await this.prisma.unitOwnership.update({
      where: { id },
      data: {
        status,
        endDate,
        version: { increment: 1 },
      },
    });
  }
}
