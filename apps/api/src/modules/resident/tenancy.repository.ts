import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { UnitTenancy, TenancyStatus } from '@community-os/types';
import type {
  CreateTenancyInput,
  UpdateTenancyInput,
  TenancyQueryParams,
} from '@community-os/validation';

export type TenancyWithRelations = UnitTenancy & {
  household?: {
    id: string;
    name: string | null;
    status: string;
    startDate: Date;
    endDate: Date | null;
    primaryContact?: {
      id: string;
      firstName: string;
      lastName: string;
      displayName: string | null;
    } | null;
    members?: Array<{
      id: string;
      relationshipType: string;
      resident: { id: string; firstName: string; lastName: string };
    }>;
  };
};

@Injectable()
export class TenancyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TenancyWithRelations | null> {
    const record = await this.prisma.unitTenancy.findUnique({
      where: { id },
      include: {
        household: {
          include: {
            primaryContact: true,
            members: { include: { resident: true } },
          },
        },
      },
    });
    return (record as unknown as TenancyWithRelations) || null;
  }

  async findActiveByUnitId(unitId: string): Promise<TenancyWithRelations | null> {
    const record = await this.prisma.unitTenancy.findFirst({
      where: {
        unitId,
        status: 'ACTIVE',
      },
      include: {
        household: {
          include: {
            primaryContact: true,
            members: { include: { resident: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
    return (record as unknown as TenancyWithRelations) || null;
  }

  async findByUnitId(
    unitId: string,
    params: TenancyQueryParams,
  ): Promise<{ items: TenancyWithRelations[]; total: number }> {
    const { page = 1, limit = 50, status, householdId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { unitId };
    if (status) where['status'] = status;
    if (householdId) where['householdId'] = householdId;

    const [total, records] = await Promise.all([
      this.prisma.unitTenancy.count({ where }),
      this.prisma.unitTenancy.findMany({
        where,
        skip,
        take: limit,
        include: {
          household: {
            include: {
              primaryContact: true,
              members: { include: { resident: true } },
            },
          },
        },
        orderBy: [{ startDate: 'desc' }],
      }),
    ]);

    return {
      items: records as unknown as TenancyWithRelations[],
      total,
    };
  }

  async create(
    organizationId: string,
    communityId: string,
    input: CreateTenancyInput,
  ): Promise<UnitTenancy> {
    const record = await this.prisma.unitTenancy.create({
      data: {
        organizationId,
        communityId,
        unitId: input.unitId,
        householdId: input.householdId,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: (input.status || 'ACTIVE') as TenancyStatus,
        agreementReference: input.agreementReference?.trim() || null,
        version: 1,
      },
    });
    return record as unknown as UnitTenancy;
  }

  async update(id: string, input: UpdateTenancyInput): Promise<UnitTenancy> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.startDate !== undefined) data['startDate'] = new Date(input.startDate);
    if (input.endDate !== undefined) {
      data['endDate'] = input.endDate ? new Date(input.endDate) : null;
    }
    if (input.agreementReference !== undefined) {
      data['agreementReference'] = input.agreementReference?.trim() || null;
    }
    if (input.status !== undefined) data['status'] = input.status as TenancyStatus;

    const record = await this.prisma.unitTenancy.update({
      where: { id },
      data,
    });
    return record as unknown as UnitTenancy;
  }

  async endTenancy(id: string, endDate: Date): Promise<void> {
    await this.prisma.unitTenancy.update({
      where: { id },
      data: {
        status: 'ENDED',
        endDate,
        version: { increment: 1 },
      },
    });
  }
}
