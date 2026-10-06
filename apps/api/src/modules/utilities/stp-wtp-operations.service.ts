import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class STPWTPOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordSTPLog(data: any) {
    return this.prisma.sTPOperationRecord.create({
      data: {
        communityId: data.communityId,
        logDate: new Date(data.logDate),
        inflowKl: data.inflowKl,
        treatedOutputKl: data.treatedOutputKl,
        reuseGardeningKl: data.reuseGardeningKl || 0.0,
        reuseFlushingKl: data.reuseFlushingKl || 0.0,
        dischargeKl: data.dischargeKl || 0.0,
        operatingHours: data.operatingHours,
      },
    });
  }

  async recordWTPLog(data: any) {
    return this.prisma.wTPOperationRecord.create({
      data: {
        communityId: data.communityId,
        logDate: new Date(data.logDate),
        inputKl: data.inputKl,
        outputKl: data.outputKl,
        rejectKl: data.rejectKl || 0.0,
        operatingHours: data.operatingHours,
      },
    });
  }
}
