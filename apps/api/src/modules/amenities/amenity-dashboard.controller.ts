import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityDashboardService } from './amenity-dashboard.service.js';

@Controller('amenities/dashboard')
@UseGuards(AuthGuard)
export class AmenityDashboardController {
  constructor(private readonly dashboardService: AmenityDashboardService) {}

  @Get('kpis')
  async getKpis(@Query('communityId') communityId: string) {
    return this.dashboardService.getKpis(communityId);
  }
}
