import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { TenantMembership, MembershipStatus } from '@community-os/types';
import type { CreateMembershipInput, MembershipQueryParams } from '@community-os/validation';
import { ConcurrencyConflictException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TenantMembership | null> {
    return this.prisma.tenantMembership.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async findByUserAndTenant(
    userId: string,
    organizationId: string,
    communityId?: string | null,
  ): Promise<TenantMembership | null> {
    return this.prisma.tenantMembership.findFirst({
      where: {
        userId,
        organizationId,
        communityId: communityId || null,
      },
      include: { user: true },
    });
  }

  async findActiveByUserId(userId: string): Promise<TenantMembership[]> {
    return this.prisma.tenantMembership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });
  }

  async findMany(
    params: MembershipQueryParams,
  ): Promise<{ items: TenantMembership[]; total: number }> {
    const { page = 1, limit = 20, organizationId, communityId, userId, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (organizationId) where['organizationId'] = organizationId;
    if (communityId) where['communityId'] = communityId;
    if (userId) where['userId'] = userId;
    if (status) where['status'] = status;

    const [total, records] = await Promise.all([
      this.prisma.tenantMembership.count({ where }),
      this.prisma.tenantMembership.findMany({
        where,
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: records,
      total,
    };
  }

  async create(data: CreateMembershipInput): Promise<TenantMembership> {
    return this.prisma.tenantMembership.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        communityId: data.communityId || null,
        status: data.status || 'ACTIVE',
        version: 1,
      },
      include: { user: true },
    });
  }

  async updateStatus(
    id: string,
    status: MembershipStatus,
    expectedVersion?: number,
  ): Promise<TenantMembership> {
    const current = await this.prisma.tenantMembership.findUnique({ where: { id } });
    if (!current) {
      return null as unknown as TenantMembership;
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConcurrencyConflictException(
        'TenantMembership',
        id,
        current.version,
        expectedVersion,
      );
    }

    return this.prisma.tenantMembership.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
      },
      include: { user: true },
    });
  }
}
