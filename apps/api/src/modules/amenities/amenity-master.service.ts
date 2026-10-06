import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateAmenityDto, CreateAmenityResourceDto } from '@community-os/contracts';

@Injectable()
export class AmenityMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async createAmenity(dto: CreateAmenityDto) {
    const existing = await this.prisma.amenity.findFirst({
      where: { communityId: dto.communityId, code: dto.code },
    });
    if (existing) throw new ConflictException('Amenity code already exists in this community');

    return this.prisma.amenity.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category || 'SPORTS',
        bookingMode: dto.bookingMode || 'INSTANT',
        capacity: dto.capacity || 1,
        requiresBooking: dto.requiresBooking ?? true,
        requiresApproval: dto.requiresApproval ?? false,
        guestAllowed: dto.guestAllowed ?? true,
        isPaid: dto.isPaid ?? false,
        locationReference: dto.locationReference,
        status: 'ACTIVE',
      },
    });
  }

  async getAmenities(communityId: string, category?: string) {
    return this.prisma.amenity.findMany({
      where: {
        communityId,
        ...(category ? { category } : {}),
      },
      include: {
        resources: true,
        operatingSchedules: true,
        bookingPolicies: { where: { isDefault: true } },
        pricingPolicies: { where: { isDefault: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getAmenityById(id: string) {
    const amenity = await this.prisma.amenity.findUnique({
      where: { id },
      include: {
        resources: true,
        operatingSchedules: true,
        specialSchedules: true,
        bookingPolicies: true,
        pricingPolicies: true,
        depositPolicies: true,
        cancellationPolicies: true,
      },
    });
    if (!amenity) throw new NotFoundException('Amenity not found');
    return amenity;
  }

  async createResource(dto: CreateAmenityResourceDto) {
    return this.prisma.amenityResource.create({
      data: {
        amenity: { connect: { id: dto.amenityId } },
        code: dto.code,
        name: dto.name,
        description: dto.description,
        resourceType: dto.resourceType || 'EXCLUSIVE',
        capacity: dto.capacity || 1,
        isExclusive: dto.isExclusive ?? true,
        linkedAsset: dto.linkedAssetId ? { connect: { id: dto.linkedAssetId } } : undefined,
        status: 'ACTIVE',
      },
    });
  }

  async getResources(amenityId: string) {
    return this.prisma.amenityResource.findMany({
      where: { amenityId },
      include: { linkedAsset: true },
      orderBy: { code: 'asc' },
    });
  }
}
