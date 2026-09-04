import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SetBookingPolicyDto, SetPricingPolicyDto } from '@community-os/contracts';

@Injectable()
export class AmenityPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async setBookingPolicy(dto: SetBookingPolicyDto) {
    return this.prisma.amenityBookingPolicy.create({
      data: {
        amenity: { connect: { id: dto.amenityId } },
        name: dto.name,
        slotModel: dto.slotModel || 'FIXED_SLOT',
        slotDurationMinutes: dto.slotDurationMinutes || 60,
        minimumDurationMinutes: dto.minimumDurationMinutes || 60,
        maximumDurationMinutes: dto.maximumDurationMinutes || 240,
        bufferBeforeMinutes: dto.bufferBeforeMinutes || 0,
        bufferAfterMinutes: dto.bufferAfterMinutes || 15,
        advanceBookingDays: dto.advanceBookingDays || 30,
        minimumNoticeMinutes: dto.minimumNoticeMinutes || 0,
        maxActiveBookingsPerUnit: dto.maxActiveBookingsPerUnit || 2,
        maxBookingsPerWeekPerUnit: dto.maxBookingsPerWeekPerUnit || 5,
        maxGuests: dto.maxGuests || 10,
        requiresCheckIn: dto.requiresCheckIn ?? true,
        checkInGraceMinutes: dto.checkInGraceMinutes || 30,
        requiresTermsAcceptance: dto.requiresTermsAcceptance ?? true,
        isDefault: true,
      },
    });
  }

  async setPricingPolicy(dto: SetPricingPolicyDto) {
    return this.prisma.amenityPricingPolicy.create({
      data: {
        amenity: { connect: { id: dto.amenityId } },
        name: dto.name,
        pricingType: dto.pricingType || 'FREE',
        baseRate: dto.baseRate,
        hourlyRate: dto.hourlyRate,
        guestRate: dto.guestRate,
        depositAmount: dto.depositAmount || 0,
        isDefault: true,
      },
    });
  }

  async getPolicies(amenityId: string) {
    const bookingPolicies = await this.prisma.amenityBookingPolicy.findMany({
      where: { amenityId },
    });
    const pricingPolicies = await this.prisma.amenityPricingPolicy.findMany({
      where: { amenityId },
    });
    const depositPolicies = await this.prisma.amenityDepositPolicy.findMany({
      where: { amenityId },
    });
    const cancellationPolicies = await this.prisma.amenityCancellationPolicy.findMany({
      where: { amenityId },
    });
    return { bookingPolicies, pricingPolicies, depositPolicies, cancellationPolicies };
  }
}
