import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { IssueParkingPermitDto } from '@community-os/contracts';
import { ParkingSequenceService } from './parking-sequence.service.js';

@Injectable()
export class ParkingPermitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: ParkingSequenceService,
  ) {}

  async issuePermit(dto: IssueParkingPermitDto) {
    const permitNumber = await this.sequence.getNextNumber('PRMIT', dto.communityId);
    const validFrom = dto.validFrom ? new Date(dto.validFrom) : new Date();
    const validUntil = dto.validUntil
      ? new Date(dto.validUntil)
      : new Date(validFrom.getTime() + 365 * 24 * 3600 * 1000);

    return this.prisma.parkingPermit.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        vehicle: { connect: { id: dto.vehicleId } },
        parkingRight: dto.parkingRightId ? { connect: { id: dto.parkingRightId } } : undefined,
        allocation: dto.allocationId ? { connect: { id: dto.allocationId } } : undefined,
        permitNumber,
        permitType: dto.permitType || 'RESIDENT',
        validFrom,
        validUntil,
        status: 'ACTIVE',
        rfidCredentialTag: dto.rfidCredentialTag,
      },
      include: { vehicle: true, allocation: { include: { parkingSlot: true } } },
    });
  }

  async revokePermit(permitId: string) {
    return this.prisma.parkingPermit.update({
      where: { id: permitId },
      data: { status: 'REVOKED' },
    });
  }

  async getPermits(communityId: string) {
    return this.prisma.parkingPermit.findMany({
      where: { communityId },
      include: {
        vehicle: true,
        allocation: { include: { parkingSlot: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
