import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { UtilityServiceMasterService } from './utility-service-master.service.js';
import { CreateUtilityServiceDto, CreateUtilitySupplySourceDto } from '@community-os/contracts';

@Controller('utilities/services')
@UseGuards(AuthGuard)
export class UtilityServicesController {
  constructor(private readonly serviceMaster: UtilityServiceMasterService) {}

  @Post()
  async createService(@Body() dto: CreateUtilityServiceDto) {
    return this.serviceMaster.createService(dto);
  }

  @Get()
  async listServices(@Query('communityId') communityId: string) {
    return this.serviceMaster.listServices(communityId);
  }

  @Post('sources')
  async createSource(@Body() dto: CreateUtilitySupplySourceDto) {
    return this.serviceMaster.createSupplySource(dto);
  }
}
