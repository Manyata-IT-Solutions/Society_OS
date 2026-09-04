import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { User, UserStatus } from '@community-os/types';
import type { CreateUserInput, UpdateUserInput, UserQueryParams } from '@community-os/validation';
import { ConcurrencyConflictException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<(User & { passwordHash: string | null }) | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone: phone.trim() },
    });
  }

  async findMany(params: UserQueryParams): Promise<{ items: User[]; total: number }> {
    const { page = 1, limit = 20, status, search, organizationId, communityId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where['status'] = status;

    if (search && search.trim() !== '') {
      where['OR'] = [
        { email: { contains: search.trim().toLowerCase(), mode: 'insensitive' } },
        { displayName: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Tenant scoping filter via memberships
    if (organizationId || communityId) {
      where['memberships'] = {
        some: {
          ...(organizationId ? { organizationId } : {}),
          ...(communityId ? { communityId } : {}),
          status: 'ACTIVE',
        },
      };
    }

    const [total, records] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: records,
      total,
    };
  }

  async create(data: CreateUserInput & { passwordHash?: string | null }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim() || null,
        displayName: data.displayName.trim(),
        passwordHash: data.passwordHash || null,
        status: 'ACTIVE',
        preferredLocale: data.preferredLocale || 'en-US',
        timezone: data.timezone || 'UTC',
        version: 1,
      },
    });
  }

  async update(id: string, data: UpdateUserInput, expectedVersion?: number): Promise<User> {
    const current = await this.prisma.user.findUnique({ where: { id } });
    if (!current) {
      return null as unknown as User;
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConcurrencyConflictException('User', id, current.version, expectedVersion);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.displayName ? { displayName: data.displayName.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.preferredLocale ? { preferredLocale: data.preferredLocale } : {}),
        ...(data.timezone ? { timezone: data.timezone } : {}),
        version: { increment: 1 },
      },
    });
  }

  async updateStatus(id: string, status: UserStatus, expectedVersion?: number): Promise<User> {
    const current = await this.prisma.user.findUnique({ where: { id } });
    if (!current) {
      return null as unknown as User;
    }

    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new ConcurrencyConflictException('User', id, current.version, expectedVersion);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
      },
    });
  }
}
