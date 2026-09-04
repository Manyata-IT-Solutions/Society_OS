import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { UtilityChargeCalculationService } from './utility-charge-calculation.service.js';
import { UtilityBillingHandoffService } from './utility-billing-handoff.service.js';
import { CalculateUtilityChargeDto, HandoffUtilityChargeDto } from '@community-os/contracts';

@Controller('utilities/charges')
@UseGuards(AuthGuard)
export class UtilityChargesController {
  constructor(
    private readonly chargeService: UtilityChargeCalculationService,
    private readonly handoffService: UtilityBillingHandoffService,
  ) {}

  @Post('calculate')
  async calculateCharge(@Body() dto: CalculateUtilityChargeDto) {
    return this.chargeService.calculateCharge(dto);
  }

  @Post('handoff')
  async handoffToBilling(@Body() dto: HandoffUtilityChargeDto) {
    return this.handoffService.handoffToBilling(dto);
  }
}
