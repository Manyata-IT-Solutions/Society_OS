import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateParkingAreaDto,
  CreateParkingSlotDto,
  BulkCreateSlotsDto,
} from '@community-os/contracts';

@Injectable()
export class ParkingInventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createArea(dto: CreateParkingAreaDto) {
    return this.prisma.parkingArea.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        code: dto.code,
        name: dto.name,
        type: dto.type || 'COVERED',
        building: dto.buildingId ? { connect: { id: dto.buildingId } } : undefined,
        floor: dto.floorId ? { connect: { id: dto.floorId } } : undefined,
        totalCapacity: dto.totalCapacity || 0,
        status: 'ACTIVE',
      },
    });
  }

  async getAreas(communityId: string) {
    return this.prisma.parkingArea.findMany({
      where: { communityId },
      include: { zones: true, slots: true },
      orderBy: { code: 'asc' },
    });
  }

  async createSlot(dto: CreateParkingSlotDto) {
    return this.prisma.parkingSlot.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        parkingArea: { connect: { id: dto.parkingAreaId } },
        zone: dto.zoneId ? { connect: { id: dto.zoneId } } : undefined,
        slotNumber: dto.slotNumber,
        slotType: dto.slotType || 'CAR',
        isAccessible: dto.isAccessible ?? false,
        isEvEnabled: dto.isEvEnabled ?? false,
        chargerAsset: dto.chargerAssetId ? { connect: { id: dto.chargerAssetId } } : undefined,
        ownershipModel: dto.ownershipModel || 'COMMON',
        status: 'AVAILABLE',
      },
    });
  }

  async bulkCreateSlots(dto: BulkCreateSlotsDto) {
    const slots = [];
    for (let i = 0; i < dto.count; i++) {
      const num = dto.startNumber + i;
      const slotNumber = `${dto.prefix}-${String(num).padStart(3, '0')}`;
      slots.push({
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        parkingAreaId: dto.parkingAreaId,
        slotNumber,
        slotType: dto.slotType || 'CAR',
        isAccessible: dto.isAccessible ?? false,
        isEvEnabled: dto.isEvEnabled ?? false,
        ownershipModel: 'COMMON',
        status: 'AVAILABLE',
      });
    }

    await this.prisma.parkingSlot.createMany({
      data: slots,
      skipDuplicates: true,
    });

    return { createdCount: slots.length };
  }

  async getSlots(communityId: string, areaId?: string, status?: string) {
    return this.prisma.parkingSlot.findMany({
      where: {
        communityId,
        ...(areaId ? { parkingAreaId: areaId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        parkingArea: true,
        zone: true,
        allocations: {
          where: { status: 'ACTIVE' },
          include: { vehicle: true, unit: true },
        },
        blocks: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { slotNumber: 'asc' },
    });
  }

  async blockSlot(
    slotId: string,
    reason: string,
    validFrom: Date,
    validUntil: Date,
    workOrderId?: string,
    projectId?: string,
  ) {
    const slot = await this.prisma.parkingSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');

    const block = await this.prisma.parkingSlotBlock.create({
      data: {
        parkingSlot: { connect: { id: slotId } },
        reason,
        validFrom,
        validUntil,
        workOrder: workOrderId ? { connect: { id: workOrderId } } : undefined,
        project: projectId ? { connect: { id: projectId } } : undefined,
        status: 'ACTIVE',
      },
    });

    await this.prisma.parkingSlot.update({
      where: { id: slotId },
      data: { status: 'BLOCKED' },
    });

    return block;
  }
}
