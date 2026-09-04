import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WaterBalanceService } from './water-balance.service.js';
import { TankerOperationsService } from './tanker-operations.service.js';
import { STPWTPOperationsService } from './stp-wtp-operations.service.js';
import { RecordWaterTankerDeliveryDto } from '@community-os/contracts';

@Controller('utilities/water')
@UseGuards(AuthGuard)
export class UtilityWaterController {
  constructor(
    private readonly balanceService: WaterBalanceService,
    private readonly tankerService: TankerOperationsService,
    private readonly stpWtpService: STPWTPOperationsService,
  ) {}

  @Get('balance')
  async getWaterBalance(
    @Query('communityId') communityId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.balanceService.calculateWaterBalance(
      communityId,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }

  @Post('tankers')
  async recordTanker(@Body() dto: RecordWaterTankerDeliveryDto) {
    return this.tankerService.recordDelivery(dto);
  }

  @Get('tankers')
  async listTankers(@Query('communityId') communityId: string) {
    return this.tankerService.listDeliveries(communityId);
  }

  @Post('stp-log')
  async recordSTPLog(@Body() data: any) {
    return this.stpWtpService.recordSTPLog(data);
  }

  @Post('wtp-log')
  async recordWTPLog(@Body() data: any) {
    return this.stpWtpService.recordWTPLog(data);
  }
}
