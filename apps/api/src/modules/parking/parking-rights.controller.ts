import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ParkingRightsService } from './parking-rights.service.js';
import { GrantParkingRightDto } from '@community-os/contracts';

@Controller('parking/rights')
@UseGuards(AuthGuard)
export class ParkingRightsController {
  constructor(private readonly rightsService: ParkingRightsService) {}

  @Post()
  async grantRight(@Body() dto: GrantParkingRightDto) {
    return this.rightsService.grantRight(dto);
  }

  @Get()
  async getRights(@Query('communityId') communityId: string, @Query('unitId') unitId?: string) {
    return this.rightsService.getRights(communityId, unitId);
  }
}
