import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityPolicyService } from './amenity-policy.service.js';
import { SetBookingPolicyDto, SetPricingPolicyDto } from '@community-os/contracts';

@Controller('amenities/policies')
@UseGuards(AuthGuard)
export class AmenityPoliciesController {
  constructor(private readonly policyService: AmenityPolicyService) {}

  @Post('booking')
  async setBookingPolicy(@Body() dto: SetBookingPolicyDto) {
    return this.policyService.setBookingPolicy(dto);
  }

  @Post('pricing')
  async setPricingPolicy(@Body() dto: SetPricingPolicyDto) {
    return this.policyService.setPricingPolicy(dto);
  }

  @Get()
  async getPolicies(@Query('amenityId') amenityId: string) {
    return this.policyService.getPolicies(amenityId);
  }
}
