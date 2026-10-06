import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Resident } from '@community-os/types';
import type {
  CreateResidentInput,
  UpdateResidentInput,
  ResidentQueryParams,
} from '@community-os/validation';

export type ResidentWithRelations = Resident & {
  user?: { id: string; email: string; displayName: string; status: string } | null;
  ownerships?: Array<{
    id: string;
    unitId: string;
    ownershipShare: unknown;
    ownershipType: string;
    isPrimaryOwner: boolean;
    startDate: Date;
    endDate: Date | null;
    status: string;
    unit?: { id: string; unitNumber: string; displayName: string };
  }>;
  householdMembers?: Array<{
    id: string;
    householdId: string;
    relationshipType: string;
    isPrimaryContact: boolean;
    status: string;
    joinedAt: Date;
    leftAt: Date | null;
  }>;
};

@Injectable()
export class ResidentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ResidentWithRelations | null> {
    const record = await this.prisma.resident.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, displayName: true, status: true } },
        ownerships: {
          include: {
            unit: { select: { id: true, unitNumber: true, displayName: true } },
          },
          orderBy: { startDate: 'desc' },
        },
        householdMembers: {
          include: {
            household: {
              include: {
                unit: { select: { id: true, unitNumber: true, displayName: true } },
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });
    return (record as unknown as ResidentWithRelations) || null;
  }

  async findByEmail(communityId: string, email: string): Promise<Resident | null> {
    const record = await this.prisma.resident.findFirst({
      where: {
        communityId,
        email: { equals: email.trim(), mode: 'insensitive' },
      },
    });
    return (record as unknown as Resident) || null;
  }

  async findByPhone(communityId: string, phone: string): Promise<Resident | null> {
    const record = await this.prisma.resident.findFirst({
      where: {
        communityId,
        phone: phone.trim(),
      },
    });
    return (record as unknown as Resident) || null;
  }

  async findByUserId(userId: string, communityId?: string): Promise<Resident[]> {
    const where: Record<string, unknown> = { userId };
    if (communityId) where['communityId'] = communityId;

    const records = await this.prisma.resident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return records as unknown as Resident[];
  }

  async findMany(
    communityId: string,
    params: ResidentQueryParams,
  ): Promise<{ items: ResidentWithRelations[]; total: number }> {
    const { page = 1, limit = 50, status, search, unitId, householdId, hasUser } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { communityId };

    if (status) where['status'] = status;
    if (hasUser === true) where['userId'] = { not: null };
    if (hasUser === false) where['userId'] = null;

    if (unitId) {
      where['OR'] = [
        { ownerships: { some: { unitId } } },
        { householdMembers: { some: { household: { unitId } } } },
      ];
    }

    if (householdId) {
      where['householdMembers'] = { some: { householdId } };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where['OR'] = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.resident.count({ where }),
      this.prisma.resident.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, displayName: true, status: true } },
          ownerships: {
            where: { status: 'ACTIVE' },
            include: { unit: { select: { id: true, unitNumber: true, displayName: true } } },
          },
          householdMembers: {
            where: { status: 'ACTIVE' },
            include: {
              household: {
                include: {
                  unit: { select: { id: true, unitNumber: true, displayName: true } },
                },
              },
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
    ]);

    return {
      items: records as unknown as ResidentWithRelations[],
      total,
    };
  }

  async create(
    organizationId: string,
    communityId: string,
    input: CreateResidentInput,
  ): Promise<Resident> {
    const displayName =
      input.displayName?.trim() || `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

    const record = await this.prisma.resident.create({
      data: {
        organizationId,
        communityId,
        firstName: input.firstName.trim(),
        middleName: input.middleName?.trim() || null,
        lastName: input.lastName.trim(),
        displayName,
        phone: input.phone?.trim() || null,
        email: input.email?.toLowerCase().trim() || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender || null,
        status: input.status || 'ACTIVE',
        preferredLanguage: input.preferredLanguage || 'en',
        version: 1,
      },
    });

    return record as unknown as Resident;
  }

  async update(id: string, input: UpdateResidentInput): Promise<Resident> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.firstName !== undefined) data['firstName'] = input.firstName.trim();
    if (input.middleName !== undefined) data['middleName'] = input.middleName?.trim() || null;
    if (input.lastName !== undefined) data['lastName'] = input.lastName.trim();
    if (input.displayName !== undefined) data['displayName'] = input.displayName?.trim() || null;
    if (input.phone !== undefined) data['phone'] = input.phone?.trim() || null;
    if (input.email !== undefined) data['email'] = input.email?.toLowerCase().trim() || null;
    if (input.dateOfBirth !== undefined) {
      data['dateOfBirth'] = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    }
    if (input.gender !== undefined) data['gender'] = input.gender;
    if (input.status !== undefined) data['status'] = input.status;
    if (input.preferredLanguage !== undefined) data['preferredLanguage'] = input.preferredLanguage;

    const record = await this.prisma.resident.update({
      where: { id },
      data,
    });

    return record as unknown as Resident;
  }

  async linkUser(id: string, userId: string): Promise<Resident> {
    const record = await this.prisma.resident.update({
      where: { id },
      data: {
        userId,
        version: { increment: 1 },
      },
    });
    return record as unknown as Resident;
  }

  async archive(id: string): Promise<Resident> {
    const record = await this.prisma.resident.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        version: { increment: 1 },
      },
    });
    return record as unknown as Resident;
  }
}
