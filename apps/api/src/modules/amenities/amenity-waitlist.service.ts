import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { JoinWaitlistDto } from '@community-os/contracts';

@Injectable()
export class AmenityWaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async joinWaitlist(dto: JoinWaitlistDto) {
    let resident = dto.residentId;
    if (!resident) {
      const res = await this.prisma.resident.findFirst();
      resident = res!.id;
    }

    return this.prisma.amenityWaitlistEntry.create({
      data: {
        amenity: { connect: { id: dto.amenityId } },
        resource: dto.resourceId ? { connect: { id: dto.resourceId } } : undefined,
        resident: { connect: { id: resident } },
        household: dto.householdId ? { connect: { id: dto.householdId } } : undefined,
        unit: dto.unitId ? { connect: { id: dto.unitId } } : undefined,
        desiredStartAt: new Date(dto.desiredStartAt),
        desiredEndAt: new Date(dto.desiredEndAt),
        partySize: dto.partySize || 1,
        status: 'WAITING',
      },
    });
  }

  async acceptOffer(entryId: string) {
    const entry = await this.prisma.amenityWaitlistEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');

    return this.prisma.amenityWaitlistEntry.update({
      where: { id: entryId },
      data: { status: 'ACCEPTED' },
    });
  }

  async getWaitlist(amenityId: string) {
    return this.prisma.amenityWaitlistEntry.findMany({
      where: { amenityId },
      include: { resident: true, resource: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
