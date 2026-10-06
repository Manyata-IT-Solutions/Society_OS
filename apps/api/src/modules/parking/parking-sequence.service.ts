import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ParkingSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextNumber(prefix: string, communityId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.parkingPermit.count({ where: { communityId } });
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}${randomSuffix}`;
  }
}
