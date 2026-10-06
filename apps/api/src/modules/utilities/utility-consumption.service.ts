import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UtilityConsumptionService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateConsumption(meterId: string, periodStart: Date, periodEnd: Date) {
    const meter = await this.prisma.utilityMeter.findUnique({
      where: { id: meterId },
    });
    if (!meter) throw new NotFoundException('Meter not found');

    const opening = await this.prisma.utilityMeterReading.findFirst({
      where: { meterId, readingAt: { lte: periodStart }, status: 'APPROVED' },
      orderBy: { readingAt: 'desc' },
    });

    const closing = await this.prisma.utilityMeterReading.findFirst({
      where: { meterId, readingAt: { lte: periodEnd, gte: periodStart }, status: 'APPROVED' },
      orderBy: { readingAt: 'desc' },
    });

    if (!opening || !closing || opening.id === closing.id) {
      throw new BadRequestException(
        'Insufficient approved readings in specified period to calculate consumption',
      );
    }

    let rawDelta = Number(closing.value) - Number(opening.value);
    if (rawDelta < 0 && meter.rolloverValue) {
      rawDelta = Number(meter.rolloverValue) - Number(opening.value) + Number(closing.value);
    }

    const multiplier = Number(closing.multiplierSnapshot || meter.multiplier || 1.0);
    const consumption = Math.max(0, rawDelta * multiplier);

    const record = await this.prisma.utilityConsumptionRecord.create({
      data: {
        meterId,
        periodStart,
        periodEnd,
        openingReadingId: opening.id,
        closingReadingId: closing.id,
        rawDelta,
        multiplierSnapshot: multiplier,
        consumption,
        uom: meter.uom,
        calculationStatus: 'VALID',
      },
    });

    return record;
  }

  async adjustConsumption(
    consumptionRecordId: string,
    deltaConsumption: number,
    reason: string,
    approvedById?: string,
  ) {
    const record = await this.prisma.utilityConsumptionRecord.findUnique({
      where: { id: consumptionRecordId },
    });
    if (!record) throw new NotFoundException('Consumption record not found');

    const _adj = await this.prisma.utilityConsumptionAdjustment.create({
      data: {
        consumptionRecordId,
        deltaConsumption,
        reason,
        approvedById,
      },
    });

    const updated = await this.prisma.utilityConsumptionRecord.update({
      where: { id: consumptionRecordId },
      data: {
        consumption: Number(record.consumption) + deltaConsumption,
        calculationVersion: record.calculationVersion + 1,
      },
      include: { adjustments: true },
    });

    return updated;
  }
}
