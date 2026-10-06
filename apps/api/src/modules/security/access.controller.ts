import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { GateAccessService } from './gate-access.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type {
  ValidatePassDto,
  CheckInVisitDto,
  CheckOutVisitDto,
  ManualCheckoutDto,
} from '@community-os/contracts';

@Controller('security/access')
@UseGuards(AuthGuard)
export class GateAccessController {
  constructor(private readonly service: GateAccessService) {}

  @Post('validate-pass')
  async validatePass(@Body() dto: ValidatePassDto, @Req() req: any) {
    return this.service.validateAndCheckInByPass(dto, req.user?.id);
  }

  @Post('check-in-walk-in')
  async checkInWalkIn(@Body() dto: CheckInVisitDto, @Req() req: any) {
    return this.service.checkInWalkIn(dto, req.user?.id);
  }

  @Post('check-out')
  async checkOut(@Body() dto: CheckOutVisitDto, @Req() req: any) {
    return this.service.checkOut(dto, req.user?.id);
  }

  @Post('manual-checkout')
  async manualCheckout(@Body() dto: ManualCheckoutDto, @Req() req: any) {
    return this.service.manualCheckout(dto, req.user?.id);
  }
}
