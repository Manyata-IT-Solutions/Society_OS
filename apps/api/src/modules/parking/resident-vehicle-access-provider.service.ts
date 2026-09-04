import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ResidentVehicleAccessProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateVehicleAccess(communityId: string, identifier: string) {
    const normalized = identifier.replace(/[^0-9A-Z]/gi, '').toUpperCase();

    // 1. Find vehicle by plate or RFID
    const permit = await this.prisma.parkingPermit.findFirst({
      where: {
        communityId,
        status: 'ACTIVE',
        validUntil: { gte: new Date() },
        OR: [
          { rfidCredentialTag: identifier },
          { vehicle: { normalizedRegistrationNumber: normalized } },
        ],
      },
      include: {
        vehicle: {
          include: {
            authorizations: {
              where: { status: 'ACTIVE', verificationStatus: 'VERIFIED' },
              include: { unit: true, household: true, resident: true },
            },
            allocations: {
              where: { status: 'ACTIVE' },
              include: { parkingSlot: true },
            },
          },
        },
        allocation: {
          include: { parkingSlot: true },
        },
      },
    });

    if (!permit) {
      return {
        recognized: false,
        allowed: false,
        reason: 'No active parking permit or valid vehicle authorization found',
      };
    }

    const slot =
      permit.allocation?.parkingSlot?.slotNumber ||
      permit.vehicle.allocations[0]?.parkingSlot?.slotNumber ||
      'UNALLOCATED';

    return {
      recognized: true,
      allowed: true,
      vehicle: permit.vehicle,
      permit,
      slotNumber: slot,
      unit: permit.vehicle.authorizations[0]?.unit?.unitNumber,
      residentName: permit.vehicle.authorizations[0]?.resident?.displayName,
    };
  }
}
