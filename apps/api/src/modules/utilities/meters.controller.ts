import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { UtilityMeterMasterService } from './utility-meter-master.service.js';
import {
  CreateUtilityMeterDto,
  AssignUtilityMeterDto,
  ReplaceUtilityMeterDto,
} from '@community-os/contracts';

@Controller('utilities/meters')
@UseGuards(AuthGuard)
export class UtilityMetersController {
  constructor(private readonly meterService: UtilityMeterMasterService) {}

  @Post()
  async createMeter(@Body() dto: CreateUtilityMeterDto) {
    return this.meterService.createMeter(dto);
  }

  @Get()
  async listMeters(
    @Query('communityId') communityId: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.meterService.listMeters(communityId, serviceId);
  }

  @Get(':id')
  async getMeterById(@Param('id') id: string) {
    return this.meterService.getMeterById(id);
  }

  @Post('assign')
  async assignMeter(@Body() dto: AssignUtilityMeterDto) {
    return this.meterService.assignMeter(dto);
  }

  @Post('replace')
  async replaceMeter(@Body() dto: ReplaceUtilityMeterDto) {
    return this.meterService.replaceMeter(dto);
  }
}
