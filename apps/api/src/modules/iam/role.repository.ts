import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Role } from '@community-os/types';
import type { CreateRoleInput, UpdateRoleInput, RoleQueryParams } from '@community-os/validation';
import { ConcurrencyConflictException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<
    | (Role & {
        permissions: Array<{
          permission: {
            id: string;
            code: string;
            resource: string;
            action: string;
            description: string | null;
          };
        }>;
      })
    | null
  > {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findByCode(code: string, organizationId?: string | null): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        organizationId: organizationId || null,
      },
    });
  }

  async findMany(params: RoleQueryParams): Promise<{ items: Role[]; total: number }> {
    const { page = 1, limit = 20, organizationId, scopeType, isSystem, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (isSystem !== undefined) where['isSystem'] = isSystem;
    if (scopeType) where['scopeType'] = scopeType;

    if (organizationId) {
      where['OR'] = [{ organizationId }, { isSystem: true }];
    }

    if (search && search.trim() !== '') {
      where['name'] = { contains: search.trim(), mode: 'insensitive' };
    }

    const [total, records] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        include: {
          permissions: {
            include: { permission: true },
          },
        },
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      items: records,
      total,
    };
  }

  async create(data: CreateRoleInput, permissionIds: string[]): Promise<Role> {
    return this.prisma.role.create({
      data: {
        name: data.name.trim(),
        code: data.code.toUpperCase().trim(),
        description: data.description?.trim() || null,
        scopeType: data.scopeType,
        isSystem: false,
        organizationId: data.organizationId || null,
        version: 1,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: UpdateRoleInput,
    permissionIds?: string[],
    expectedVersion?: number,
  ): Promise<Role> {
    const current = await this.prisma.role.findUnique({ where: { id } });
    if (!current) {
      return null as unknown as Role;
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConcurrencyConflictException('Role', id, current.version, expectedVersion);
    }

    if (permissionIds) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined
          ? { description: data.description?.trim() || null }
          : {}),
        version: { increment: 1 },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }
}
