import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class VendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.VendorCreateInput) {
    return this.prisma.vendor.create({
      data,
      include: {
        contacts: true,
        addresses: true,
        taxRegistrations: true,
        documents: true,
        capabilities: {
          include: {
            inventoryCategory: true,
          },
        },
        communityLinks: true,
      },
    });
  }

  async findById(id: string, organizationId?: string) {
    return this.prisma.vendor.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        contacts: true,
        addresses: true,
        taxRegistrations: true,
        documents: true,
        capabilities: {
          include: {
            inventoryCategory: true,
          },
        },
        communityLinks: true,
      },
    });
  }

  async findByCode(organizationId: string, vendorCode: string) {
    return this.prisma.vendor.findUnique({
      where: {
        organizationId_vendorCode: {
          organizationId,
          vendorCode,
        },
      },
      include: {
        contacts: true,
        addresses: true,
        taxRegistrations: true,
        documents: true,
        capabilities: true,
        communityLinks: true,
      },
    });
  }

  async findMany(params: {
    organizationId: string;
    communityId?: string;
    status?: any;
    onboardingStatus?: any;
    vendorType?: any;
    search?: string;
    isPreferred?: boolean;
    skip?: number;
    take?: number;
  }) {
    const {
      organizationId,
      communityId,
      status,
      onboardingStatus,
      vendorType,
      search,
      isPreferred,
      skip = 0,
      take = 50,
    } = params;

    const where: Prisma.VendorWhereInput = {
      organizationId,
      ...(status ? { status } : {}),
      ...(onboardingStatus ? { onboardingStatus } : {}),
      ...(vendorType ? { vendorType } : {}),
      ...(isPreferred !== undefined ? { isPreferred } : {}),
      ...(communityId
        ? {
            OR: [
              { communityLinks: { some: { communityId } } },
              { communityLinks: { none: {} } }, // Available to all if not restricted
            ],
          }
        : {}),
      ...(search
        ? {
            OR: [
              { legalName: { contains: search, mode: 'insensitive' } },
              { displayName: { contains: search, mode: 'insensitive' } },
              { vendorCode: { contains: search, mode: 'insensitive' } },
              { primaryEmail: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          contacts: true,
          addresses: true,
          taxRegistrations: true,
          documents: true,
          capabilities: true,
          communityLinks: true,
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { items, total };
  }

  async update(id: string, organizationId: string, data: Prisma.VendorUpdateInput) {
    return this.prisma.vendor.update({
      where: { id },
      data,
      include: {
        contacts: true,
        addresses: true,
        taxRegistrations: true,
        documents: true,
        capabilities: true,
        communityLinks: true,
      },
    });
  }
}
