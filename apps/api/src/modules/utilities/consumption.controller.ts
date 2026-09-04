import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { UtilityConsumptionService } from './utility-consumption.service.js';
import { CommonAreaAllocationService } from './common-area-allocation.service.js';
import { CommonAreaAllocationDto } from '@community-os/contracts';

@Controller('utilities/consumption')
@UseGuards(AuthGuard)
export class UtilityConsumptionController {
  constructor(
    private readonly consumptionService: UtilityConsumptionService,
    private readonly allocationService: CommonAreaAllocationService,
  ) {}

  @Post('calculate')
  async calculateConsumption(
    @Body('meterId') meterId: string,
    @Body('periodStart') periodStart: string,
    @Body('periodEnd') periodEnd: string,
  ) {
    return this.consumptionService.calculateConsumption(
      meterId,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }

  @Post('adjust')
  async adjustConsumption(
    @Body('consumptionRecordId') consumptionRecordId: string,
    @Body('deltaConsumption') deltaConsumption: number,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.consumptionService.adjustConsumption(
      consumptionRecordId,
      deltaConsumption,
      reason,
      req?.user?.id,
    );
  }

  @Post('allocate-common')
  async allocateCommonUsage(@Body() dto: CommonAreaAllocationDto) {
    return this.allocationService.allocateCommonUsage(dto);
  }
}
