import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ContractorAccessService } from './contractor-access.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type { CreateContractorAuthorizationDto } from '@community-os/contracts';

@Controller('security/contractors')
@UseGuards(AuthGuard)
export class ContractorAccessController {
  constructor(private readonly service: ContractorAccessService) {}

  @Post()
  async createAuthorization(@Body() dto: CreateContractorAuthorizationDto) {
    return this.service.createAuthorization(dto);
  }

  @Get()
  async getAuthorizations(@Query('communityId') communityId: string) {
    return this.service.getAuthorizations(communityId);
  }
}
