import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityMasterService } from './amenity-master.service.js';
import { CreateAmenityResourceDto } from '@community-os/contracts';

@Controller('amenities/resources')
@UseGuards(AuthGuard)
export class AmenityResourcesController {
  constructor(private readonly masterService: AmenityMasterService) {}

  @Post()
  async createResource(@Body() dto: CreateAmenityResourceDto) {
    return this.masterService.createResource(dto);
  }

  @Get()
  async getResources(@Query('amenityId') amenityId: string) {
    return this.masterService.getResources(amenityId);
  }
}
