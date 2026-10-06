import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceDashboardService } from './workforce-dashboard.service.js';
import { WorkforceCoverageEngine } from './workforce-coverage.engine.js';
import { WorkforceIntegrityService } from './workforce-integrity.service.js';

@Controller('workforce/dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: WorkforceDashboardService,
    private readonly coverageEngine: WorkforceCoverageEngine,
    private readonly integrityService: WorkforceIntegrityService,
  ) {}

  @Get('kpis')
  async getKpis(@Query('communityId') communityId: string) {
    return this.dashboardService.getKpis(communityId);
  }

  @Get('coverage')
  async getCoverage(@Query('communityId') communityId: string, @Query('date') date: string) {
    return this.coverageEngine.analyzeCoverage(communityId, date);
  }

  @Get('integrity-audit')
  async auditIntegrity(@Query('communityId') communityId: string) {
    return this.integrityService.auditDiscrepancies(communityId);
  }
}
