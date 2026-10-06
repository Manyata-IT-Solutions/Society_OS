import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AmenitySequenceService } from './amenity-sequence.service.js';
import { AmenityEligibilityService } from './amenity-eligibility.service.js';
import { CreateBookingDto, DecideBookingApprovalDto } from '@community-os/contracts';

@Injectable()
export class AmenityBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: AmenitySequenceService,
    private readonly eligibility: AmenityEligibilityService,
  ) {}

  async createBooking(dto: CreateBookingDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('Booking start time must be before end time');
    }

    // 1. Eligibility Check
    const elig = await this.eligibility.checkEligibility(dto.amenityId, dto.residentId, dto.unitId);
    if (!elig.eligible) {
      throw new BadRequestException(elig.reason);
    }

    // 2. Fetch Amenity & Policies
    const amenity = await this.prisma.amenity.findUnique({
      where: { id: dto.amenityId },
      include: {
        resources: { where: { status: 'ACTIVE' }, orderBy: { code: 'asc' } },
        pricingPolicies: { where: { isDefault: true } },
      },
    });

    if (!amenity) throw new NotFoundException('Amenity not found');

    // Concurrency-safe atomic transaction for slot allocation
    return this.prisma.$transaction(async (tx) => {
      let targetResource = null;

      if (dto.resourceId) {
        targetResource = amenity.resources.find((r) => r.id === dto.resourceId);
        if (!targetResource)
          throw new NotFoundException('Specified resource not found or inactive');

        // Check maintenance block
        const block = await tx.amenityMaintenanceBlock.findFirst({
          where: {
            amenityId: dto.amenityId,
            status: 'ACTIVE',
            OR: [{ resourceId: dto.resourceId }, { resourceId: null }],
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        });
        if (block)
          throw new ConflictException('Resource is under maintenance during requested period');

        // Check conflict for exclusive resource
        if (targetResource.isExclusive) {
          const conflict = await tx.amenityBooking.findFirst({
            where: {
              resourceId: dto.resourceId,
              status: {
                in: ['CONFIRMED', 'PENDING_APPROVAL', 'PENDING_PAYMENT', 'CHECKED_IN', 'IN_USE'],
              },
              startAt: { lt: endAt },
              endAt: { gt: startAt },
            },
          });
          if (conflict) {
            throw new ConflictException(
              'Booking conflict: Resource is already reserved for this time slot',
            );
          }
        } else {
          // Capacity based
          const overlappingBookings = await tx.amenityBooking.findMany({
            where: {
              resourceId: dto.resourceId,
              status: { in: ['CONFIRMED', 'PENDING_APPROVAL', 'CHECKED_IN', 'IN_USE'] },
              startAt: { lt: endAt },
              endAt: { gt: startAt },
            },
          });
          const reservedCapacity = overlappingBookings.reduce(
            (sum, b) => sum + b.participantCount,
            0,
          );
          const requested = dto.participantCount || 1;
          if (reservedCapacity + requested > targetResource.capacity) {
            throw new ConflictException('Capacity exceeded for requested time slot');
          }
        }
      } else {
        // Auto-assign first available resource ("Any Court")
        for (const res of amenity.resources) {
          const block = await tx.amenityMaintenanceBlock.findFirst({
            where: {
              amenityId: dto.amenityId,
              status: 'ACTIVE',
              OR: [{ resourceId: res.id }, { resourceId: null }],
              startAt: { lt: endAt },
              endAt: { gt: startAt },
            },
          });
          if (block) {
            continue;
          }

          const conflict = await tx.amenityBooking.findFirst({
            where: {
              resourceId: res.id,
              status: { in: ['CONFIRMED', 'PENDING_APPROVAL', 'CHECKED_IN', 'IN_USE'] },
              startAt: { lt: endAt },
              endAt: { gt: startAt },
            },
          });
          if (!conflict) {
            targetResource = res;
            break;
          }
        }
        if (!targetResource && amenity.resources.length > 0) {
          throw new ConflictException('All resources are booked for this time slot');
        }
      }

      // Calculate Price & Deposit Snapshot
      const pricing = amenity.pricingPolicies[0];
      const basePrice = pricing?.baseRate ? Number(pricing.baseRate) : 0;
      const depositAmount = pricing?.depositAmount ? Number(pricing.depositAmount) : 0;
      const totalCharged = basePrice;

      const bookingNumber = await this.sequence.getNextNumber('AMB', dto.communityId);
      const isApprovalRequired = amenity.requiresApproval || false;

      let resident = dto.residentId;
      if (!resident) {
        const res = await tx.resident.findFirst({ where: { organizationId: dto.organizationId } });
        resident = res!.id;
      }

      const booking = await tx.amenityBooking.create({
        data: {
          organization: { connect: { id: dto.organizationId } },
          community: { connect: { id: dto.communityId } },
          amenity: { connect: { id: dto.amenityId } },
          resource: targetResource ? { connect: { id: targetResource.id } } : undefined,
          bookedByResident: { connect: { id: resident } },
          household: dto.householdId ? { connect: { id: dto.householdId } } : undefined,
          unit: dto.unitId ? { connect: { id: dto.unitId } } : undefined,
          bookingNumber,
          bookingType: dto.bookingType || 'STANDARD',
          startAt,
          endAt,
          participantCount: dto.participantCount || 1,
          guestCount: dto.guestCount || 0,
          status: isApprovalRequired ? 'PENDING_APPROVAL' : 'CONFIRMED',
          approvalStatus: isApprovalRequired ? 'PENDING' : 'NOT_REQUIRED',
          basePrice,
          depositAmount,
          totalCharged,
          depositStatus: depositAmount > 0 ? 'REQUIRED' : 'NOT_REQUIRED',
          termsAcceptedAt: dto.termsAccepted ? new Date() : new Date(),
          parkingRequested: dto.parkingRequested ?? false,
        },
        include: { amenity: true, resource: true, bookedByResident: true, unit: true },
      });

      return booking;
    });
  }

  async decideApproval(dto: DecideBookingApprovalDto, userId?: string) {
    const booking = await this.prisma.amenityBooking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.amenityBooking.update({
      where: { id: dto.bookingId },
      data: {
        approvalStatus: dto.approved ? 'APPROVED' : 'REJECTED',
        status: dto.approved ? 'CONFIRMED' : 'REJECTED',
        approvedBy: userId ? { connect: { id: userId } } : undefined,
        approvedAt: new Date(),
      },
    });
  }

  async cancelBooking(bookingId: string, reason?: string) {
    const booking = await this.prisma.amenityBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.prisma.amenityBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by resident/operator',
      },
    });

    // Check waitlist promotion
    const waitlistEntry = await this.prisma.amenityWaitlistEntry.findFirst({
      where: {
        amenityId: booking.amenityId,
        status: 'WAITING',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (waitlistEntry) {
      await this.prisma.amenityWaitlistEntry.update({
        where: { id: waitlistEntry.id },
        data: {
          status: 'OFFERED',
          offeredAt: new Date(),
          offerExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min offer window
        },
      });
    }

    return updated;
  }

  async rescheduleBooking(bookingId: string, newStartAt: string, newEndAt: string) {
    const booking = await this.prisma.amenityBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const startAt = new Date(newStartAt);
    const endAt = new Date(newEndAt);

    return this.prisma.$transaction(async (tx) => {
      if (booking.resourceId) {
        const block = await tx.amenityMaintenanceBlock.findFirst({
          where: {
            amenityId: booking.amenityId,
            status: 'ACTIVE',
            OR: [{ resourceId: booking.resourceId }, { resourceId: null }],
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        });
        if (block) {
          throw new ConflictException('Resource is under maintenance during requested period');
        }

        const conflict = await tx.amenityBooking.findFirst({
          where: {
            id: { not: bookingId },
            resourceId: booking.resourceId,
            status: { in: ['CONFIRMED', 'PENDING_APPROVAL', 'CHECKED_IN', 'IN_USE'] },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        });
        if (conflict) {
          throw new ConflictException('New time slot has conflicting booking');
        }
      }

      return tx.amenityBooking.update({
        where: { id: bookingId },
        data: { startAt, endAt },
      });
    });
  }

  async getBookings(communityId: string, status?: string) {
    return this.prisma.amenityBooking.findMany({
      where: {
        communityId,
        ...(status ? { status } : {}),
      },
      include: {
        amenity: true,
        resource: true,
        bookedByResident: true,
        unit: true,
      },
      orderBy: { startAt: 'desc' },
    });
  }
}
