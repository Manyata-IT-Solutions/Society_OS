import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ReportEngineService } from './report-engine.service.js';
import { CreateReportDefinitionDto, ScheduleReportDto } from '@community-os/contracts';

@Controller('analytics/reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reportService: ReportEngineService) {}

  @Post()
  async createReport(@Body() dto: CreateReportDefinitionDto) {
    return this.reportService.createReport(dto);
  }

  @Post('schedule')
  async scheduleReport(@Body() dto: ScheduleReportDto) {
    return this.reportService.scheduleReport(dto);
  }

  @Post('snapshots/:reportId')
  async generateSnapshot(@Param('reportId') reportId: string) {
    return this.reportService.generateReportSnapshot(reportId);
  }

  @Get()
  async listReports(@Query('domain') domain?: string) {
    return this.reportService.listReports(domain);
  }
}
