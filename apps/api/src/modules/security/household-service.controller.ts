import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { HouseholdServiceAccessService } from './household-service.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type { CreateHouseholdServiceAccessDto } from '@community-os/contracts';

@Controller('security/household-services')
@UseGuards(AuthGuard)
export class HouseholdServiceController {
  constructor(private readonly service: HouseholdServiceAccessService) {}

  @Post()
  async createServiceAccess(@Body() dto: CreateHouseholdServiceAccessDto) {
    return this.service.createServiceAccess(dto);
  }

  @Get()
  async getServiceAccesses(@Query('communityId') communityId: string) {
    return this.service.getServiceAccesses(communityId);
  }
}
