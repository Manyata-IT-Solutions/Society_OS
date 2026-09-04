import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SetOperatingScheduleDto } from '@community-os/contracts';

@Injectable()
export class AmenityScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async setOperatingSchedule(dto: SetOperatingScheduleDto) {
    return this.prisma.amenityOperatingSchedule.create({
      data: {
        amenity: { connect: { id: dto.amenityId } },
        dayOfWeek: dto.dayOfWeek,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
    });
  }

  async setSpecialSchedule(
    amenityId: string,
    specificDate: string,
    isClosed: boolean,
    openTime?: string,
    closeTime?: string,
    reason?: string,
  ) {
    return this.prisma.amenitySpecialSchedule.create({
      data: {
        amenity: { connect: { id: amenityId } },
        specificDate: new Date(specificDate),
        isClosed,
        openTime,
        closeTime,
        reason: reason || 'Special Holiday / Event Closure',
      },
    });
  }

  async getSchedules(amenityId: string) {
    const regular = await this.prisma.amenityOperatingSchedule.findMany({
      where: { amenityId },
      orderBy: { dayOfWeek: 'asc' },
    });
    const special = await this.prisma.amenitySpecialSchedule.findMany({
      where: { amenityId },
      orderBy: { specificDate: 'asc' },
    });
    return { regular, special };
  }
}
