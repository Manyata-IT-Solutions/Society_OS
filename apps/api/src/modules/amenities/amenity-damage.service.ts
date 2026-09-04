import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ReportDamageDto, SettleDepositDto } from '@community-os/contracts';

@Injectable()
export class AmenityDamageService {
  constructor(private readonly prisma: PrismaService) {}

  async reportDamage(dto: ReportDamageDto, userId?: string) {
    return this.prisma.amenityDamageReport.create({
      data: {
        booking: { connect: { id: dto.bookingId } },
        amenity: { connect: { id: dto.amenityId } },
        resource: dto.resourceId ? { connect: { id: dto.resourceId } } : undefined,
        description: dto.description,
        severity: dto.severity || 'LOW',
        estimatedAmount: dto.estimatedAmount,
        reportedBy: userId ? { connect: { id: userId } } : undefined,
        status: 'REPORTED',
      },
    });
  }

  async settleDeposit(dto: SettleDepositDto) {
    const booking = await this.prisma.amenityBooking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (dto.damageReportId) {
      await this.prisma.amenityDamageReport.update({
        where: { id: dto.damageReportId },
        data: {
          approvedDeductionAmount: dto.approvedDeductionAmount,
          status: 'SETTLED',
        },
      });
    }

    return this.prisma.amenityBooking.update({
      where: { id: dto.bookingId },
      data: {
        depositStatus: dto.approvedDeductionAmount > 0 ? 'PARTIALLY_APPLIED' : 'REFUNDED',
      },
    });
  }

  async getDamageReports(amenityId?: string) {
    return this.prisma.amenityDamageReport.findMany({
      where: { ...(amenityId ? { amenityId } : {}) },
      include: { booking: true, amenity: true, resource: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
