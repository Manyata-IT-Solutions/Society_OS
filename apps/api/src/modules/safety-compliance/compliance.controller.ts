import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ComplianceRequirementService } from './compliance-requirement.service.js';
import {
  CreateComplianceRequirementDto,
  CreateComplianceObligationDto,
} from '@community-os/contracts';

@Controller('safety/compliance')
@UseGuards(AuthGuard)
export class ComplianceController {
  constructor(private readonly compService: ComplianceRequirementService) {}

  @Post('requirements')
  async createRequirement(@Body() dto: CreateComplianceRequirementDto) {
    return this.compService.createRequirement(dto);
  }

  @Post('obligations')
  async createObligation(@Body() dto: CreateComplianceObligationDto) {
    return this.compService.createObligation(dto);
  }

  @Get('requirements')
  async listRequirements(@Query('communityId') communityId: string) {
    return this.compService.listRequirements(communityId);
  }
}
