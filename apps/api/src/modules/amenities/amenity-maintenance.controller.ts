import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityMaintenanceService } from './amenity-maintenance.service.js';
import { CreateMaintenanceBlockDto } from '@community-os/contracts';

@Controller('amenities/maintenance-blocks')
@UseGuards(AuthGuard)
export class AmenityMaintenanceController {
  constructor(private readonly maintenanceService: AmenityMaintenanceService) {}

  @Post()
  async createBlock(@Body() dto: CreateMaintenanceBlockDto) {
    return this.maintenanceService.createBlock(dto);
  }

  @Get()
  async getBlocks(@Query('amenityId') amenityId: string) {
    return this.maintenanceService.getBlocks(amenityId);
  }
}
