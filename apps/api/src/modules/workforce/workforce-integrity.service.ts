import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class WorkforceIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async auditDiscrepancies(communityId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Workers with active attendance without active engagement
    const invalidAttendance = await this.prisma.attendanceSession.findMany({
      where: {
        communityId,
        attendanceDate: today,
        worker: {
          engagements: { none: { status: 'ACTIVE' } },
        },
      },
      include: { worker: true },
    });

    // 2. Active workers with expired certifications
    const expiredCertWorkers = await this.prisma.worker.findMany({
      where: {
        primaryCommunityId: communityId,
        status: 'ACTIVE',
        certifications: {
          some: { expiryDate: { lt: new Date() } },
        },
      },
      include: { certifications: true },
    });

    return {
      invalidAttendanceCount: invalidAttendance.length,
      expiredCertificationWorkersCount: expiredCertWorkers.length,
      discrepancies: {
        invalidAttendance: invalidAttendance.map((a) => ({
          id: a.id,
          worker: a.worker.displayName,
        })),
        expiredCertWorkers: expiredCertWorkers.map((w) => ({ id: w.id, name: w.displayName })),
      },
    };
  }
}
