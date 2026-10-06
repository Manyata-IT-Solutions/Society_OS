import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Portfolio, EntityStatus } from '@community-os/types';
import type {
  CreatePortfolioInput,
  UpdatePortfolioInput,
  PortfolioQueryParams,
} from '@community-os/validation';

@Injectable()
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Portfolio | null> {
    const record = await this.prisma.portfolio.findUnique({
      where: { id },
      include: { communities: true },
    });
    return (record as unknown as Portfolio) || null;
  }

  async findBySlug(organizationId: string, slug: string): Promise<Portfolio | null> {
    const record = await this.prisma.portfolio.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug: slug.toLowerCase().trim(),
        },
      },
    });
    return (record as unknown as Portfolio) || null;
  }

  async findByCode(organizationId: string, code: string): Promise<Portfolio | null> {
    const record = await this.prisma.portfolio.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: code.toUpperCase().trim(),
        },
      },
    });
    return (record as unknown as Portfolio) || null;
  }

  async findMany(
    organizationId: string,
    params: PortfolioQueryParams,
  ): Promise<{ items: Portfolio[]; total: number }> {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    if (status) where['status'] = status;
    if (search && search.trim() !== '') {
      where['OR'] = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { code: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.portfolio.count({ where }),
      this.prisma.portfolio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: records as unknown as Portfolio[],
      total,
    };
  }

  async create(organizationId: string, input: CreatePortfolioInput): Promise<Portfolio> {
    const slug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const record = await this.prisma.portfolio.create({
      data: {
        organizationId,
        name: input.name.trim(),
        code: input.code.toUpperCase().trim(),
        slug,
        description: input.description?.trim() || null,
        status: 'ACTIVE',
        version: 1,
      },
    });

    return record as unknown as Portfolio;
  }

  async update(id: string, input: UpdatePortfolioInput): Promise<Portfolio> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.name !== undefined) data['name'] = input.name.trim();
    if (input.description !== undefined) data['description'] = input.description?.trim() || null;
    if (input.status !== undefined) data['status'] = input.status;

    const record = await this.prisma.portfolio.update({
      where: { id, version: input.version },
      data,
    });

    return record as unknown as Portfolio;
  }

  async changeStatus(
    id: string,
    status: EntityStatus,
    expectedVersion: number,
  ): Promise<Portfolio> {
    const record = await this.prisma.portfolio.update({
      where: { id, version: expectedVersion },
      data: {
        status,
        version: { increment: 1 },
      },
    });

    return record as unknown as Portfolio;
  }
}
