import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class WorkforceSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextWorkerNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.worker.count({ where: { organizationId } });
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `WRK-${year}-${String(count + 1).padStart(4, '0')}${randomSuffix}`;
  }
}
