import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ElectricityBalanceService } from './electricity-balance.service.js';
import { DGOperationsService } from './dg-operations.service.js';
import { SolarOperationsService } from './solar-operations.service.js';
import { RecordDGRunSessionDto, RecordSolarGenerationDto } from '@community-os/contracts';

@Controller('utilities/energy')
@UseGuards(AuthGuard)
export class UtilityEnergyController {
  constructor(
    private readonly balanceService: ElectricityBalanceService,
    private readonly dgService: DGOperationsService,
    private readonly solarService: SolarOperationsService,
  ) {}

  @Get('balance')
  async getEnergyBalance(
    @Query('communityId') communityId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.balanceService.calculateEnergyBalance(
      communityId,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }

  @Post('dg-runs')
  async recordDGRun(@Body() dto: RecordDGRunSessionDto) {
    return this.dgService.recordRunSession(dto);
  }

  @Get('dg-runs')
  async listDGRuns(@Query('communityId') communityId: string) {
    return this.dgService.listSessions(communityId);
  }

  @Post('solar-generation')
  async recordSolarGeneration(@Body() dto: RecordSolarGenerationDto) {
    return this.solarService.recordGeneration(dto);
  }
}
