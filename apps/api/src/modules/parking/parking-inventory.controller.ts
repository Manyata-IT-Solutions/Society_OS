import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ParkingInventoryService } from './parking-inventory.service.js';
import {
  CreateParkingAreaDto,
  CreateParkingSlotDto,
  BulkCreateSlotsDto,
} from '@community-os/contracts';

@Controller('parking/inventory')
@UseGuards(AuthGuard)
export class ParkingInventoryController {
  constructor(private readonly inventoryService: ParkingInventoryService) {}

  @Post('areas')
  async createArea(@Body() dto: CreateParkingAreaDto) {
    return this.inventoryService.createArea(dto);
  }

  @Get('areas')
  async getAreas(@Query('communityId') communityId: string) {
    return this.inventoryService.getAreas(communityId);
  }

  @Post('slots')
  async createSlot(@Body() dto: CreateParkingSlotDto) {
    return this.inventoryService.createSlot(dto);
  }

  @Post('slots/bulk')
  async bulkCreateSlots(@Body() dto: BulkCreateSlotsDto) {
    return this.inventoryService.bulkCreateSlots(dto);
  }

  @Get('slots')
  async getSlots(
    @Query('communityId') communityId: string,
    @Query('areaId') areaId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getSlots(communityId, areaId, status);
  }

  @Post('slots/:id/block')
  async blockSlot(
    @Param('id') slotId: string,
    @Body()
    body: {
      reason: string;
      validFrom: string;
      validUntil: string;
      workOrderId?: string;
      projectId?: string;
    },
  ) {
    return this.inventoryService.blockSlot(
      slotId,
      body.reason,
      new Date(body.validFrom),
      new Date(body.validUntil),
      body.workOrderId,
      body.projectId,
    );
  }
}
