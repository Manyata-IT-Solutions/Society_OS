import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ParkingDashboardService } from './parking-dashboard.service.js';

@Controller('parking/dashboard')
@UseGuards(AuthGuard)
export class ParkingDashboardController {
  constructor(private readonly dashboardService: ParkingDashboardService) {}

  @Get('kpis')
  async getKpis(@Query('communityId') communityId: string) {
    return this.dashboardService.getKpis(communityId);
  }
}
