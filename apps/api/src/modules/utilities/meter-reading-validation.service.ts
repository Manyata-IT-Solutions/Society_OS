import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class MeterReadingValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateReading(meterId: string, readingValue: number, readingAt: Date) {
    const meter = await this.prisma.utilityMeter.findUnique({
      where: { id: meterId },
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }

    if (meter.status !== 'ACTIVE' && meter.status !== 'INSTALLED') {
      return { isValid: false, status: 'WARNING', message: `Meter status is ${meter.status}` };
    }

    const previousReading = await this.prisma.utilityMeterReading.findFirst({
      where: { meterId, readingAt: { lt: readingAt }, status: 'APPROVED' },
      orderBy: { readingAt: 'desc' },
    });

    if (previousReading) {
      const prevVal = Number(previousReading.value);
      if (readingValue < prevVal) {
        // Check if rollover occurred
        if (meter.rolloverValue && prevVal > Number(meter.rolloverValue) * 0.9) {
          return {
            isValid: true,
            status: 'VALID',
            isRollover: true,
            rawDelta: Number(meter.rolloverValue) - prevVal + readingValue,
          };
        }
        return {
          isValid: false,
          status: 'WARNING',
          message: `Reading value (${readingValue}) is less than previous reading (${prevVal}). Rollover or reset verification required.`,
        };
      }
    }

    return {
      isValid: true,
      status: 'VALID',
      rawDelta: previousReading ? readingValue - Number(previousReading.value) : 0,
    };
  }
}
