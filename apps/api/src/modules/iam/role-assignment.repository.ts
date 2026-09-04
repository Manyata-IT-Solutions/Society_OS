import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { RoleAssignment } from '@community-os/types';
import type {
  CreateRoleAssignmentInput,
  RoleAssignmentQueryParams,
} from '@community-os/validation';

export type RoleAssignmentWithRole = RoleAssignment & {
  role?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    scopeType: string;
    isSystem: boolean;
    organizationId: string | null;
    permissions: Array<{
      permission: {
        id: string;
        code: string;
        resource: string;
        action: string;
        description: string | null;
      };
    }>;
  };
};

@Injectable()
export class RoleAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RoleAssignment | null> {
    return this.prisma.roleAssignment.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
  }

  async findActiveByUserId(userId: string): Promise<RoleAssignmentWithRole[]> {
    return this.prisma.roleAssignment.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    }) as unknown as RoleAssignmentWithRole[];
  }

  async findMany(
    params: RoleAssignmentQueryParams,
  ): Promise<{ items: RoleAssignmentWithRole[]; total: number }> {
    const { page = 1, limit = 20, userId, roleId, scopeType, scopeId, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (userId) where['userId'] = userId;
    if (roleId) where['roleId'] = roleId;
    if (scopeType) where['scopeType'] = scopeType;
    if (scopeId) where['scopeId'] = scopeId;
    if (status) where['status'] = status;

    const [total, records] = await Promise.all([
      this.prisma.roleAssignment.count({ where }),
      this.prisma.roleAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: records,
      total,
    };
  }

  async create(data: CreateRoleAssignmentInput): Promise<RoleAssignment> {
    return this.prisma.roleAssignment.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
        scopeType: data.scopeType,
        scopeId: data.scopeId || null,
        status: 'ACTIVE',
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
  }

  async revoke(id: string): Promise<RoleAssignment> {
    return this.prisma.roleAssignment.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
