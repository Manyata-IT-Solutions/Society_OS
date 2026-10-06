import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UtilitySequenceService } from './utility-sequence.service.js';
import {
  CreateUtilityMeterDto,
  AssignUtilityMeterDto,
  ReplaceUtilityMeterDto,
} from '@community-os/contracts';

@Injectable()
export class UtilityMeterMasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: UtilitySequenceService,
  ) {}

  async createMeter(dto: CreateUtilityMeterDto) {
    const meterNumber =
      dto.meterNumber || (await this.sequence.getNextMeterNumber(dto.communityId));

    const existing = await this.prisma.utilityMeter.findUnique({
      where: { meterNumber },
    });
    if (existing) {
      throw new ConflictException(`Meter with number ${meterNumber} already exists`);
    }

    return this.prisma.utilityMeter.create({
      data: {
        organizationId: dto.organizationId,
        communityId: dto.communityId,
        utilityServiceId: dto.utilityServiceId,
        meterNumber,
        serialNumber: dto.serialNumber,
        meterType: (dto.meterType as any) || 'SUB_METER',
        measurementType: (dto.measurementType as any) || 'ENERGY',
        uom: dto.uom,
        multiplier: dto.multiplier || 1.0,
        decimalPlaces: dto.decimalPlaces || 2,
        rolloverValue: dto.rolloverValue,
        parentMeterId: dto.parentMeterId,
        assetId: dto.assetId,
        status: 'ACTIVE',
      },
      include: { utilityService: true, parentMeter: true },
    });
  }

  async listMeters(communityId: string, serviceId?: string) {
    const where: any = { communityId };
    if (serviceId) where.utilityServiceId = serviceId;

    return this.prisma.utilityMeter.findMany({
      where,
      include: {
        utilityService: true,
        assignments: { where: { effectiveUntil: null }, include: { unit: true } },
        readings: { orderBy: { readingAt: 'desc' }, take: 2 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMeterById(id: string) {
    const meter = await this.prisma.utilityMeter.findUnique({
      where: { id },
      include: {
        utilityService: true,
        parentMeter: true,
        childMeters: true,
        assignments: { include: { unit: true }, orderBy: { effectiveFrom: 'desc' } },
        readings: { orderBy: { readingAt: 'desc' }, take: 10 },
        consumptionRecords: { orderBy: { periodStart: 'desc' }, take: 5 },
        calibrations: { orderBy: { calibratedAt: 'desc' } },
        anomalies: { where: { status: 'OPEN' } },
      },
    });
    if (!meter) {
      throw new NotFoundException(`Utility Meter with ID ${id} not found`);
    }
    return meter;
  }

  async assignMeter(dto: AssignUtilityMeterDto) {
    return this.prisma.utilityMeterAssignment.create({
      data: {
        meterId: dto.meterId,
        targetType: dto.targetType as any,
        targetId: dto.targetId,
        unitId: dto.targetType === 'UNIT' ? dto.targetId : undefined,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
        allocationPercentage: dto.allocationPercentage || 100.0,
      },
    });
  }

  async replaceMeter(dto: ReplaceUtilityMeterDto) {
    return this.prisma.$transaction(async (tx: any) => {
      const oldMeter = await tx.utilityMeter.findUnique({
        where: { id: dto.oldMeterId },
        include: { assignments: { where: { effectiveUntil: null } } },
      });
      if (!oldMeter) throw new NotFoundException('Old meter not found');

      const newMeter = await tx.utilityMeter.findUnique({
        where: { id: dto.newMeterId },
      });
      if (!newMeter) throw new NotFoundException('New meter not found');

      const effectiveDate = new Date(dto.effectiveAt);

      // 1. Record final reading on old meter
      await tx.utilityMeterReading.create({
        data: {
          meterId: dto.oldMeterId,
          readingAt: effectiveDate,
          value: dto.oldMeterFinalReading,
          uom: oldMeter.uom,
          readingType: 'REPLACEMENT_FINAL',
          status: 'APPROVED',
          quality: 'GOOD',
          multiplierSnapshot: oldMeter.multiplier,
        },
      });

      // 2. Mark old meter as REPLACED
      await tx.utilityMeter.update({
        where: { id: dto.oldMeterId },
        data: { status: 'REPLACED' },
      });

      // 3. Record opening reading on new meter
      await tx.utilityMeterReading.create({
        data: {
          meterId: dto.newMeterId,
          readingAt: effectiveDate,
          value: dto.newMeterOpeningReading,
          uom: newMeter.uom,
          readingType: 'REPLACEMENT_OPENING',
          status: 'APPROVED',
          quality: 'GOOD',
          multiplierSnapshot: newMeter.multiplier,
        },
      });

      // 4. Transfer active assignments
      for (const a of oldMeter.assignments) {
        await tx.utilityMeterAssignment.update({
          where: { id: a.id },
          data: { effectiveUntil: effectiveDate },
        });

        await tx.utilityMeterAssignment.create({
          data: {
            meterId: dto.newMeterId,
            targetType: a.targetType,
            targetId: a.targetId,
            unitId: a.unitId,
            effectiveFrom: effectiveDate,
            allocationPercentage: a.allocationPercentage,
          },
        });
      }

      // 5. Create replacement record
      const record = await tx.meterReplacementRecord.create({
        data: {
          oldMeterId: dto.oldMeterId,
          newMeterId: dto.newMeterId,
          effectiveAt: effectiveDate,
          oldMeterFinalReading: dto.oldMeterFinalReading,
          newMeterOpeningReading: dto.newMeterOpeningReading,
          reason: dto.reason,
        },
      });

      return record;
    });
  }
}
