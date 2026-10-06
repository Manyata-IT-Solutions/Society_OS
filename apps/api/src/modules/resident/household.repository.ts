import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  Household,
  HouseholdMember,
  HouseholdRelationshipType,
  HouseholdMemberStatus,
} from '@community-os/types';
import type {
  CreateHouseholdInput,
  UpdateHouseholdInput,
  HouseholdQueryParams,
  AddHouseholdMemberInput,
  UpdateHouseholdMemberInput,
} from '@community-os/validation';

export type HouseholdWithRelations = Household & {
  members?: Array<
    HouseholdMember & {
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
    }
  >;
  primaryContact?: {
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
  } | null;
  unit?: {
    id: string;
    unitNumber: string;
    displayName: string;
    building?: { id: string; name: string; code: string } | null;
  };
};

@Injectable()
export class HouseholdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<HouseholdWithRelations | null> {
    const record = await this.prisma.household.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            resident: true,
          },
          orderBy: { joinedAt: 'asc' },
        },
        primaryContact: true,
        unit: {
          select: {
            id: true,
            unitNumber: true,
            displayName: true,
            building: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    return (record as unknown as HouseholdWithRelations) || null;
  }

  async findActiveByUnitId(unitId: string): Promise<HouseholdWithRelations | null> {
    const record = await this.prisma.household.findFirst({
      where: {
        unitId,
        status: 'ACTIVE',
      },
      include: {
        members: {
          include: { resident: true },
          orderBy: { joinedAt: 'asc' },
        },
        primaryContact: true,
        unit: {
          select: {
            id: true,
            unitNumber: true,
            displayName: true,
            building: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
    return (record as unknown as HouseholdWithRelations) || null;
  }

  async findByUnitId(
    unitId: string,
    params: HouseholdQueryParams,
  ): Promise<{ items: HouseholdWithRelations[]; total: number }> {
    const { page = 1, limit = 50, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { unitId };
    if (status) where['status'] = status;
    if (search && search.trim() !== '') {
      where['name'] = { contains: search.trim(), mode: 'insensitive' };
    }

    const [total, records] = await Promise.all([
      this.prisma.household.count({ where }),
      this.prisma.household.findMany({
        where,
        skip,
        take: limit,
        include: {
          members: {
            include: { resident: true },
            orderBy: { joinedAt: 'asc' },
          },
          primaryContact: true,
          unit: {
            select: {
              id: true,
              unitNumber: true,
              displayName: true,
              building: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: [{ startDate: 'desc' }],
      }),
    ]);

    return {
      items: records as unknown as HouseholdWithRelations[],
      total,
    };
  }

  async findByCommunityId(
    communityId: string,
    params: HouseholdQueryParams,
  ): Promise<{ items: HouseholdWithRelations[]; total: number }> {
    const { page = 1, limit = 50, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { communityId };
    if (status) where['status'] = status;
    if (search && search.trim() !== '') {
      where['name'] = { contains: search.trim(), mode: 'insensitive' };
    }

    const [total, records] = await Promise.all([
      this.prisma.household.count({ where }),
      this.prisma.household.findMany({
        where,
        skip,
        take: limit,
        include: {
          members: {
            include: { resident: true },
            orderBy: { joinedAt: 'asc' },
          },
          primaryContact: true,
          unit: {
            select: {
              id: true,
              unitNumber: true,
              displayName: true,
              building: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    return {
      items: records as unknown as HouseholdWithRelations[],
      total,
    };
  }

  async create(
    organizationId: string,
    communityId: string,
    input: CreateHouseholdInput,
  ): Promise<Household> {
    const record = await this.prisma.household.create({
      data: {
        organizationId,
        communityId,
        unitId: input.unitId,
        name: input.name?.trim() || null,
        status: input.status || 'ACTIVE',
        primaryContactResidentId: input.primaryContactResidentId || null,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        version: 1,
      },
    });
    return record as unknown as Household;
  }

  async update(id: string, input: UpdateHouseholdInput): Promise<Household> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.name !== undefined) data['name'] = input.name?.trim() || null;
    if (input.primaryContactResidentId !== undefined) {
      data['primaryContactResidentId'] = input.primaryContactResidentId;
    }
    if (input.startDate !== undefined) data['startDate'] = new Date(input.startDate);
    if (input.endDate !== undefined) {
      data['endDate'] = input.endDate ? new Date(input.endDate) : null;
    }
    if (input.status !== undefined) data['status'] = input.status;

    const record = await this.prisma.household.update({
      where: { id },
      data,
    });
    return record as unknown as Household;
  }

  // --- HOUSEHOLD MEMBERS ---
  async addMember(
    organizationId: string,
    communityId: string,
    householdId: string,
    input: AddHouseholdMemberInput,
  ): Promise<HouseholdMember> {
    const record = await this.prisma.householdMember.create({
      data: {
        organizationId,
        communityId,
        householdId,
        residentId: input.residentId,
        relationshipType: (input.relationshipType || 'SELF') as HouseholdRelationshipType,
        isPrimaryContact: Boolean(input.isPrimaryContact),
        status: 'ACTIVE',
        joinedAt: input.joinedAt ? new Date(input.joinedAt) : new Date(),
        version: 1,
      },
    });
    return record as unknown as HouseholdMember;
  }

  async findMember(householdId: string, residentId: string): Promise<HouseholdMember | null> {
    const record = await this.prisma.householdMember.findUnique({
      where: {
        householdId_residentId: { householdId, residentId },
      },
    });
    return (record as unknown as HouseholdMember) || null;
  }

  async updateMember(
    householdId: string,
    residentId: string,
    input: UpdateHouseholdMemberInput,
  ): Promise<HouseholdMember> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.relationshipType !== undefined) {
      data['relationshipType'] = input.relationshipType as HouseholdRelationshipType;
    }
    if (input.isPrimaryContact !== undefined) {
      data['isPrimaryContact'] = input.isPrimaryContact;
    }
    if (input.status !== undefined) {
      data['status'] = input.status as HouseholdMemberStatus;
    }
    if (input.leftAt !== undefined) {
      data['leftAt'] = input.leftAt ? new Date(input.leftAt) : null;
    }

    const record = await this.prisma.householdMember.update({
      where: {
        householdId_residentId: { householdId, residentId },
      },
      data,
    });
    return record as unknown as HouseholdMember;
  }

  async removeMember(householdId: string, residentId: string, leftAt = new Date()): Promise<void> {
    await this.prisma.householdMember.update({
      where: {
        householdId_residentId: { householdId, residentId },
      },
      data: {
        status: 'LEFT',
        leftAt,
        version: { increment: 1 },
      },
    });
  }
}
