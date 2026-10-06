import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class UtilitySequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextMeterNumber(communityId: string, prefix = 'MTR'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.utilityMeter.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (await this.prisma.utilityMeter.findUnique({ where: { meterNumber: candidate } })) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }

  async getNextDeliveryNumber(communityId: string, prefix = 'WT'): Promise<string> {
    const year = new Date().getFullYear();
    let count = await this.prisma.waterTankerDelivery.count();
    let seq = String(count + 1).padStart(6, '0');
    let candidate = `${prefix}-${year}-${seq}`;
    while (
      await this.prisma.waterTankerDelivery.findUnique({ where: { deliveryNumber: candidate } })
    ) {
      count++;
      seq = String(count + 1).padStart(6, '0');
      candidate = `${prefix}-${year}-${seq}`;
    }
    return candidate;
  }
}
