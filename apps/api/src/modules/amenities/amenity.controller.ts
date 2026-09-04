import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AmenityMasterService } from './amenity-master.service.js';
import { CreateAmenityDto } from '@community-os/contracts';

@Controller('amenities')
@UseGuards(AuthGuard)
export class AmenityController {
  constructor(private readonly masterService: AmenityMasterService) {}

  @Post()
  async createAmenity(@Body() dto: CreateAmenityDto) {
    return this.masterService.createAmenity(dto);
  }

  @Get()
  async getAmenities(
    @Query('communityId') communityId: string,
    @Query('category') category?: string,
  ) {
    return this.masterService.getAmenities(communityId, category);
  }

  @Get(':id')
  async getAmenityById(@Param('id') id: string) {
    return this.masterService.getAmenityById(id);
  }
}
