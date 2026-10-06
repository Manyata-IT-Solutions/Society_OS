import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AmenityEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async checkEligibility(amenityId: string, residentId?: string, unitId?: string) {
    const amenity = await this.prisma.amenity.findUnique({ where: { id: amenityId } });
    if (!amenity || amenity.status !== 'ACTIVE') {
      return { eligible: false, reason: 'Amenity is not currently active' };
    }

    if (unitId) {
      // Check unit active bookings count against policy
      const policy = await this.prisma.amenityBookingPolicy.findFirst({
        where: { amenityId, isDefault: true },
      });
      const maxActive = policy?.maxActiveBookingsPerUnit || 3;
      const activeCount = await this.prisma.amenityBooking.count({
        where: {
          amenityId,
          unitId,
          status: { in: ['CONFIRMED', 'PENDING_APPROVAL', 'PENDING_PAYMENT'] },
          endAt: { gte: new Date() },
        },
      });

      if (activeCount >= maxActive) {
        return {
          eligible: false,
          reason: `Unit has reached maximum active bookings quota (${maxActive})`,
        };
      }
    }

    return { eligible: true, reason: 'Eligible to book' };
  }
}
