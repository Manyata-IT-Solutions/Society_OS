import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateParkingAllocationDto } from '@community-os/contracts';

@Injectable()
export class ParkingAllocationService {
  constructor(private readonly prisma: PrismaService) {}

  async allocateSlot(dto: CreateParkingAllocationDto) {
    // Transaction with atomic check to avoid double-allocation race condition
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify right
      const right = await tx.parkingRight.findUnique({
        where: { id: dto.parkingRightId },
        include: { allocations: { where: { status: 'ACTIVE' } } },
      });
      if (!right || right.status !== 'ACTIVE') {
        throw new BadRequestException('Active parking right required');
      }

      if (right.allocations.length >= right.quantity) {
        throw new BadRequestException('Parking right quota fully consumed');
      }

      // 2. Check slot availability
      const slot = await tx.parkingSlot.findUnique({
        where: { id: dto.parkingSlotId },
        include: { allocations: { where: { status: 'ACTIVE' } } },
      });

      if (!slot) throw new NotFoundException('Parking slot not found');
      if (slot.status === 'BLOCKED' || slot.status === 'MAINTENANCE') {
        throw new BadRequestException('Slot is currently blocked or under maintenance');
      }

      if (slot.allocations.length > 0) {
        throw new ConflictException('Parking slot already has an active allocation');
      }

      // 3. Create allocation
      const allocation = await tx.parkingAllocation.create({
        data: {
          organization: { connect: { id: dto.organizationId } },
          community: { connect: { id: dto.communityId } },
          parkingRight: { connect: { id: dto.parkingRightId } },
          parkingSlot: { connect: { id: dto.parkingSlotId } },
          vehicle: dto.vehicleId ? { connect: { id: dto.vehicleId } } : undefined,
          unit: dto.unitId
            ? { connect: { id: dto.unitId } }
            : right.unitId
              ? { connect: { id: right.unitId } }
              : undefined,
          household: dto.householdId
            ? { connect: { id: dto.householdId } }
            : right.householdId
              ? { connect: { id: right.householdId } }
              : undefined,
          allocationType: dto.allocationType || 'PERMANENT',
          validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          status: 'ACTIVE',
        },
        include: { parkingSlot: true, vehicle: true, unit: true },
      });

      return allocation;
    });
  }

  async endAllocation(allocationId: string) {
    const alloc = await this.prisma.parkingAllocation.findUnique({
      where: { id: allocationId },
    });
    if (!alloc) throw new NotFoundException('Allocation not found');

    return this.prisma.parkingAllocation.update({
      where: { id: allocationId },
      data: {
        status: 'COMPLETED',
        validUntil: new Date(),
      },
    });
  }

  async getAllocations(communityId: string, unitId?: string) {
    return this.prisma.parkingAllocation.findMany({
      where: {
        communityId,
        ...(unitId ? { unitId } : {}),
      },
      include: {
        parkingSlot: true,
        vehicle: true,
        unit: true,
        parkingRight: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
