import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { MeterReadingValidationService } from './meter-reading-validation.service.js';
import {
  RecordMeterReadingDto,
  CorrectMeterReadingDto,
  EstimateMeterReadingDto,
} from '@community-os/contracts';

@Injectable()
export class MeterReadingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: MeterReadingValidationService,
  ) {}

  async recordReading(dto: RecordMeterReadingDto, submittedById?: string) {
    const meter = await this.prisma.utilityMeter.findUnique({
      where: { id: dto.meterId },
    });
    if (!meter) throw new NotFoundException('Meter not found');

    const readingDate = new Date(dto.readingAt);
    const validation = await this.validator.validateReading(dto.meterId, dto.value, readingDate);

    const reading = await this.prisma.utilityMeterReading.create({
      data: {
        meterId: dto.meterId,
        readingAt: readingDate,
        value: dto.value,
        uom: dto.uom || meter.uom,
        readingType: (dto.readingType as any) || 'ACTUAL',
        source: (dto.source as any) || 'MANUAL',
        status: validation.isValid ? 'APPROVED' : 'WARNING',
        quality: validation.isValid ? 'GOOD' : 'MANUAL_REVIEW',
        multiplierSnapshot: meter.multiplier,
        submittedById,
        evidenceDocumentId: dto.evidenceDocumentId,
        notes: dto.notes,
      },
    });

    return reading;
  }

  async correctReading(dto: CorrectMeterReadingDto, _approverId?: string) {
    const original = await this.prisma.utilityMeterReading.findUnique({
      where: { id: dto.readingId },
      include: { meter: true },
    });
    if (!original) throw new NotFoundException('Original reading not found');

    // Mark original as CORRECTED / SUPERSEDED
    await this.prisma.utilityMeterReading.update({
      where: { id: dto.readingId },
      data: { status: 'SUPERSEDED' },
    });

    // Create superseding reading
    const corrected = await this.prisma.utilityMeterReading.create({
      data: {
        meterId: original.meterId,
        readingAt: original.readingAt,
        value: dto.correctedValue,
        uom: original.uom,
        readingType: 'CORRECTION',
        source: 'MANUAL',
        status: 'APPROVED',
        quality: 'GOOD',
        multiplierSnapshot: original.multiplierSnapshot,
        notes: `Correction: ${dto.reason}`,
      },
    });

    return corrected;
  }

  async estimateReading(dto: EstimateMeterReadingDto, submittedById?: string) {
    const meter = await this.prisma.utilityMeter.findUnique({
      where: { id: dto.meterId },
    });
    if (!meter) throw new NotFoundException('Meter not found');

    return this.prisma.utilityMeterReading.create({
      data: {
        meterId: dto.meterId,
        readingAt: new Date(dto.readingAt),
        value: dto.estimatedValue,
        uom: meter.uom,
        readingType: 'ESTIMATED',
        source: 'MANUAL',
        status: 'APPROVED',
        quality: 'ESTIMATED',
        multiplierSnapshot: meter.multiplier,
        submittedById,
        notes: `Estimated via method: ${dto.estimationMethod}`,
      },
    });
  }
}
