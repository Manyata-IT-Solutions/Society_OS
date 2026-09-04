import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateMaintenanceBlockDto } from '@community-os/contracts';

@Injectable()
export class AmenityMaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createBlock(dto: CreateMaintenanceBlockDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    // Identify affected confirmed bookings
    const affectedBookings = await this.prisma.amenityBooking.findMany({
      where: {
        amenityId: dto.amenityId,
        ...(dto.resourceId ? { resourceId: dto.resourceId } : {}),
        status: { in: ['CONFIRMED', 'PENDING_APPROVAL'] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    const block = await this.prisma.amenityMaintenanceBlock.create({
      data: {
        amenity: { connect: { id: dto.amenityId } },
        resource: dto.resourceId ? { connect: { id: dto.resourceId } } : undefined,
        reason: dto.reason,
        startAt,
        endAt,
        workOrder: dto.workOrderId ? { connect: { id: dto.workOrderId } } : undefined,
        project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
        status: 'ACTIVE',
      },
    });

    return { block, affectedBookingsCount: affectedBookings.length };
  }

  async getBlocks(amenityId: string) {
    return this.prisma.amenityMaintenanceBlock.findMany({
      where: { amenityId, status: 'ACTIVE' },
      include: { resource: true, workOrder: true },
      orderBy: { startAt: 'asc' },
    });
  }
}
