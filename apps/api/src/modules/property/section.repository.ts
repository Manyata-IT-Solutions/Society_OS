import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { CommunitySection } from '@community-os/types';
import type {
  CreateSectionInput,
  UpdateSectionInput,
  SectionQueryParams,
} from '@community-os/validation';

@Injectable()
export class SectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CommunitySection | null> {
    const record = await this.prisma.communitySection.findUnique({
      where: { id },
      include: {
        buildings: true,
        _count: { select: { buildings: true, units: true } },
      },
    });
    return (record as unknown as CommunitySection) || null;
  }

  async findByCode(communityId: string, code: string): Promise<CommunitySection | null> {
    const record = await this.prisma.communitySection.findUnique({
      where: {
        communityId_code: {
          communityId,
          code: code.toUpperCase().trim(),
        },
      },
    });
    return (record as unknown as CommunitySection) || null;
  }

  async findBySlug(communityId: string, slug: string): Promise<CommunitySection | null> {
    const record = await this.prisma.communitySection.findUnique({
      where: {
        communityId_slug: {
          communityId,
          slug: slug.toLowerCase().trim(),
        },
      },
    });
    return (record as unknown as CommunitySection) || null;
  }

  async findMany(
    communityId: string,
    params: SectionQueryParams,
  ): Promise<{ items: CommunitySection[]; total: number }> {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { communityId };

    if (status) where['status'] = status;
    if (search && search.trim() !== '') {
      where['OR'] = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { code: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.communitySection.count({ where }),
      this.prisma.communitySection.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      items: records as unknown as CommunitySection[],
      total,
    };
  }

  async create(
    organizationId: string,
    communityId: string,
    input: CreateSectionInput,
  ): Promise<CommunitySection> {
    const slug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const record = await this.prisma.communitySection.create({
      data: {
        organizationId,
        communityId,
        name: input.name.trim(),
        code: input.code.toUpperCase().trim(),
        slug,
        description: input.description?.trim() || null,
        status: 'ACTIVE',
        sortOrder: input.sortOrder || 0,
        version: 1,
      },
    });

    return record as unknown as CommunitySection;
  }

  async update(id: string, input: UpdateSectionInput): Promise<CommunitySection> {
    const data: Record<string, unknown> = {
      version: { increment: 1 },
    };

    if (input.name !== undefined) data['name'] = input.name.trim();
    if (input.description !== undefined) data['description'] = input.description?.trim() || null;
    if (input.status !== undefined) data['status'] = input.status;
    if (input.sortOrder !== undefined) data['sortOrder'] = input.sortOrder;

    const record = await this.prisma.communitySection.update({
      where: { id, version: input.version },
      data,
    });

    return record as unknown as CommunitySection;
  }
}
