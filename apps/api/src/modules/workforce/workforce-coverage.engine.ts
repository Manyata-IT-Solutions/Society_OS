import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class WorkforceCoverageEngine {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeCoverage(communityId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const shifts = await this.prisma.shiftInstance.findMany({
      where: {
        communityId,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        shiftTemplate: true,
        assignments: {
          where: { status: 'CONFIRMED' },
          include: { worker: true },
        },
      },
    });

    const report = shifts.map((s) => {
      const required = s.requiredHeadcount;
      const assigned = s.assignments.length;
      let status: 'FULL' | 'UNDERSTAFFED' | 'OVERSTAFFED' | 'UNSTAFFED' = 'FULL';

      if (assigned === 0) status = 'UNSTAFFED';
      else if (assigned < required) status = 'UNDERSTAFFED';
      else if (assigned > required) status = 'OVERSTAFFED';

      return {
        shiftId: s.id,
        templateName: s.shiftTemplate?.name || 'Custom Shift',
        startAt: s.startAt,
        endAt: s.endAt,
        location: s.locationReference,
        requiredHeadcount: required,
        assignedCount: assigned,
        coverageStatus: status,
        gap: Math.max(0, required - assigned),
        assignedWorkers: s.assignments.map((a) => a.worker.displayName),
      };
    });

    const totalRequired = report.reduce((sum, r) => sum + r.requiredHeadcount, 0);
    const totalAssigned = report.reduce((sum, r) => sum + r.assignedCount, 0);
    const totalGap = report.reduce((sum, r) => sum + r.gap, 0);

    return {
      date: dateStr,
      totalShifts: shifts.length,
      totalRequired,
      totalAssigned,
      totalGap,
      overallStatus: totalGap === 0 ? 'FULL' : 'UNDERSTAFFED',
      shifts: report,
    };
  }
}
