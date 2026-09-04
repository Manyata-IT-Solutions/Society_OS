import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { UtilityTariffService } from './utility-tariff.service.js';
import { CreateUtilityTariffPlanDto } from '@community-os/contracts';

@Controller('utilities/tariffs')
@UseGuards(AuthGuard)
export class UtilityTariffsController {
  constructor(private readonly tariffService: UtilityTariffService) {}

  @Post()
  async createTariffPlan(@Body() dto: CreateUtilityTariffPlanDto) {
    return this.tariffService.createTariffPlan(dto);
  }

  @Get('effective/:serviceId')
  async getEffectiveTariff(
    @Param('serviceId') serviceId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.tariffService.getEffectiveTariff(serviceId, date);
  }
}
