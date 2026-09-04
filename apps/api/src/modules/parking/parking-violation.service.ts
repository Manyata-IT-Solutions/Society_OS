import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateParkingViolationDto, DecideViolationAppealDto } from '@community-os/contracts';
import { ParkingSequenceService } from './parking-sequence.service.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ParkingViolationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: ParkingSequenceService,
  ) {}

  async createViolation(dto: CreateParkingViolationDto, reportedById?: string) {
    const violationNumber = await this.sequence.getNextNumber('VIOL', dto.communityId);
    let reporter = null;
    if (reportedById && UUID_REGEX.test(reportedById)) {
      const u = await this.prisma.user.findUnique({ where: { id: reportedById } });
      if (u) reporter = u.id;
    }
    if (!reporter) {
      const u = await this.prisma.user.findFirst();
      reporter = u?.id;
    }

    return this.prisma.parkingViolation.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        community: { connect: { id: dto.communityId } },
        violationNumber,
        vehicleNumber: dto.vehicleNumber,
        vehicle: dto.vehicleId ? { connect: { id: dto.vehicleId } } : undefined,
        parkingSlot: dto.parkingSlotId ? { connect: { id: dto.parkingSlotId } } : undefined,
        parkingArea: dto.parkingAreaId ? { connect: { id: dto.parkingAreaId } } : undefined,
        violationType: dto.violationType || 'UNAUTHORIZED_PARKING',
        severity: dto.severity || 'MEDIUM',
        description: dto.description,
        penaltyChargeAmount: dto.penaltyChargeAmount,
        status: 'OPEN',
        reportedBy: reporter ? { connect: { id: reporter } } : undefined,
      },
      include: { parkingSlot: true, vehicle: true },
    });
  }

  async confirmViolation(violationId: string, penaltyAmount?: number, _userId?: string) {
    return this.prisma.parkingViolation.update({
      where: { id: violationId },
      data: {
        status: 'CONFIRMED',
        ...(penaltyAmount ? { penaltyChargeAmount: penaltyAmount, penaltyBilled: true } : {}),
      },
    });
  }

  async appealViolation(violationId: string, residentOrUserId?: string, reason?: string) {
    let res = null;
    if (residentOrUserId && UUID_REGEX.test(residentOrUserId)) {
      res = await this.prisma.resident.findUnique({ where: { id: residentOrUserId } });
    }
    if (!res) {
      res = await this.prisma.resident.findFirst();
    }
    return this.prisma.parkingViolationAppeal.create({
      data: {
        violation: { connect: { id: violationId } },
        resident: { connect: { id: res!.id } },
        reason: reason || 'Violation appeal submitted',
        status: 'SUBMITTED',
      },
    });
  }

  async decideAppeal(dto: DecideViolationAppealDto, reviewerId?: string) {
    const appeal = await this.prisma.parkingViolationAppeal.findUnique({
      where: { id: dto.appealId },
    });
    if (!appeal) throw new NotFoundException('Appeal not found');

    let reviewer = null;
    if (reviewerId && UUID_REGEX.test(reviewerId)) {
      const u = await this.prisma.user.findUnique({ where: { id: reviewerId } });
      if (u) reviewer = u.id;
    }
    if (!reviewer) {
      const u = await this.prisma.user.findFirst();
      reviewer = u?.id;
    }

    const updatedAppeal = await this.prisma.parkingViolationAppeal.update({
      where: { id: dto.appealId },
      data: {
        status: dto.approved ? 'APPROVED' : 'REJECTED',
        reviewedBy: reviewer ? { connect: { id: reviewer } } : undefined,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
      },
    });

    if (dto.approved) {
      await this.prisma.parkingViolation.update({
        where: { id: appeal.violationId },
        data: { status: 'WAIVED' },
      });
    }

    return updatedAppeal;
  }

  async getViolations(communityId: string) {
    return this.prisma.parkingViolation.findMany({
      where: { communityId },
      include: {
        parkingSlot: true,
        vehicle: true,
        appeals: { include: { resident: true } },
      },
      orderBy: { occurredAt: 'desc' },
    });
  }
}
