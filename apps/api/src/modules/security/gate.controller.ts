import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SecurityGateService } from './security-gate.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type { CreateSecurityGateDto } from '@community-os/contracts';

@Controller('security/gates')
@UseGuards(AuthGuard)
export class SecurityGateController {
  constructor(private readonly service: SecurityGateService) {}

  @Post()
  async createGate(@Body() dto: CreateSecurityGateDto, @Req() req: any) {
    return this.service.createGate(dto, req.user?.id);
  }

  @Get()
  async getGates(@Query('communityId') communityId: string) {
    return this.service.getGates(communityId);
  }

  @Get(':id')
  async getGateById(@Param('id') id: string) {
    return this.service.getGateById(id);
  }
}
