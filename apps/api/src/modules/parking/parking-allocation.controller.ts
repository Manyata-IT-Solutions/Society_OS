import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ParkingAllocationService } from './parking-allocation.service.js';
import { CreateParkingAllocationDto } from '@community-os/contracts';

@Controller('parking/allocations')
@UseGuards(AuthGuard)
export class ParkingAllocationController {
  constructor(private readonly allocationService: ParkingAllocationService) {}

  @Post()
  async allocateSlot(@Body() dto: CreateParkingAllocationDto) {
    return this.allocationService.allocateSlot(dto);
  }

  @Post(':id/end')
  async endAllocation(@Param('id') id: string) {
    return this.allocationService.endAllocation(id);
  }

  @Get()
  async getAllocations(
    @Query('communityId') communityId: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.allocationService.getAllocations(communityId, unitId);
  }
}
