import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityDamageService } from './amenity-damage.service.js';
import { ReportDamageDto, SettleDepositDto } from '@community-os/contracts';

@Controller('amenities/damage-reports')
@UseGuards(AuthGuard)
export class AmenityDamageController {
  constructor(private readonly damageService: AmenityDamageService) {}

  @Post()
  async reportDamage(@Body() dto: ReportDamageDto, @Req() req: any) {
    return this.damageService.reportDamage(dto, req.user?.sub || req.user?.id);
  }

  @Post('settle')
  async settleDeposit(@Body() dto: SettleDepositDto) {
    return this.damageService.settleDeposit(dto);
  }

  @Get()
  async getDamageReports(@Query('amenityId') amenityId?: string) {
    return this.damageService.getDamageReports(amenityId);
  }
}
