import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateReportDefinitionDto, ScheduleReportDto } from '@community-os/contracts';

@Injectable()
export class ReportEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(dto: CreateReportDefinitionDto) {
    return this.prisma.reportDefinition.create({
      data: {
        reportKey: dto.reportKey,
        name: dto.name,
        description: dto.description,
        domain: dto.domain,
        datasetKey: dto.datasetKey,
        columnsPayload: dto.columnsPayload,
        filtersPayload: dto.filtersPayload,
        groupingPayload: dto.groupingPayload,
        sortingPayload: dto.sortingPayload,
        status: 'ACTIVE',
      },
    });
  }

  async scheduleReport(dto: ScheduleReportDto) {
    return this.prisma.reportSchedule.create({
      data: {
        reportId: dto.reportId,
        scheduleCron: dto.scheduleCron,
        timezone: dto.timezone || 'UTC',
        format: dto.format,
        recipients: dto.recipients,
        filtersPayload: dto.filtersPayload,
        status: 'ACTIVE',
      },
    });
  }

  async generateReportSnapshot(reportId: string) {
    const report = await this.prisma.reportDefinition.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');

    // Deterministic preview/snapshot payload
    const snapshotData = [
      { unit: '101', billed: 5000, paid: 5000, balance: 0, status: 'PAID' },
      { unit: '102', billed: 5000, paid: 3000, balance: 2000, status: 'PARTIALLY_PAID' },
    ];

    return this.prisma.reportSnapshot.create({
      data: {
        reportId,
        versionNumber: report.version,
        filtersPayload: report.filtersPayload || {},
        dataPayload: snapshotData,
      },
    });
  }

  async listReports(domain?: string) {
    const where: any = { status: 'ACTIVE' };
    if (domain) where.domain = domain;
    return this.prisma.reportDefinition.findMany({
      where,
      include: { schedules: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
