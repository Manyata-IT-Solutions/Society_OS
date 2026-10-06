import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ParkingOccupancyService } from './parking-occupancy.service.js';
import { RecordOccupancyDto } from '@community-os/contracts';

@Controller('parking/occupancy')
@UseGuards(AuthGuard)
export class ParkingOccupancyController {
  constructor(private readonly occupancyService: ParkingOccupancyService) {}

  @Post('entry')
  async recordOccupancy(@Body() dto: RecordOccupancyDto) {
    return this.occupancyService.recordOccupancy(dto);
  }

  @Post('exit/:vehicleId')
  async recordExit(@Param('vehicleId') vehicleId: string, @Body() body: { exitGateId?: string }) {
    return this.occupancyService.recordExit(vehicleId, body.exitGateId);
  }

  @Get('active')
  async getActiveSessions(@Query('communityId') communityId: string) {
    return this.occupancyService.getActiveSessions(communityId);
  }
}
