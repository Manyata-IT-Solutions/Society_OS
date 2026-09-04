import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { GrantParkingRightDto } from '@community-os/contracts';

@Injectable()
export class ParkingRightsService {
  constructor(private readonly prisma: PrismaService) {}

  async grantRight(dto: GrantParkingRightDto) {
    return this.prisma.parkingRight.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        unit: dto.unitId ? { connect: { id: dto.unitId } } : undefined,
        household: dto.householdId ? { connect: { id: dto.householdId } } : undefined,
        resident: dto.residentId ? { connect: { id: dto.residentId } } : undefined,
        rightType: dto.rightType || 'ASSIGNED',
        slotTypeEligibility: dto.slotTypeEligibility || 'CAR',
        quantity: dto.quantity || 1,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        status: 'ACTIVE',
      },
    });
  }

  async getRights(communityId: string, unitId?: string) {
    return this.prisma.parkingRight.findMany({
      where: {
        communityId,
        ...(unitId ? { unitId } : {}),
      },
      include: {
        unit: true,
        household: true,
        allocations: {
          include: { parkingSlot: true, vehicle: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
