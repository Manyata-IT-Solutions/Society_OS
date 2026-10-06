import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { VehicleRegistryService } from './vehicle-registry.service.js';
import { RegisterVehicleDto, VerifyVehicleDto } from '@community-os/contracts';

@Controller('parking/vehicles')
@UseGuards(AuthGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleRegistryService) {}

  @Post('register')
  async registerVehicle(@Body() dto: RegisterVehicleDto, @Req() req: any) {
    return this.vehicleService.registerVehicle(dto, req.user?.sub || req.user?.id);
  }

  @Post('verify')
  async verifyVehicle(@Body() dto: VerifyVehicleDto, @Req() req: any) {
    return this.vehicleService.verifyVehicle(dto, req.user?.sub || req.user?.id);
  }

  @Get()
  async getVehicles(@Query('communityId') communityId: string, @Query('search') search?: string) {
    return this.vehicleService.getVehicles(communityId, search);
  }
}
