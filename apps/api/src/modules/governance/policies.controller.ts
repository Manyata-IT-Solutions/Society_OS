import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernancePolicyService } from './governance-policy.service.js';
import {
  CreateGovernancePolicyDto,
  RevisePolicyDto,
  AcknowledgePolicyDto,
} from '@community-os/contracts';

@Controller('governance/policies')
@UseGuards(AuthGuard)
export class GovernancePoliciesController {
  constructor(private readonly policyService: GovernancePolicyService) {}

  @Post()
  async createPolicy(@Body() dto: CreateGovernancePolicyDto, @Req() req: any) {
    return this.policyService.createPolicy(dto, req.user?.id);
  }

  @Post('revise')
  async revisePolicy(@Body() dto: RevisePolicyDto, @Req() req: any) {
    return this.policyService.revisePolicy(dto, req.user?.id);
  }

  @Get(':id/effective')
  async getEffectivePolicy(@Param('id') id: string, @Query('asOfDate') asOfDate?: string) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.policyService.resolveEffectivePolicy(id, date);
  }

  @Post('acknowledge')
  async acknowledgePolicy(@Body() dto: AcknowledgePolicyDto) {
    return this.policyService.acknowledgePolicy(dto);
  }

  @Get()
  async listPolicies(@Query('communityId') communityId: string) {
    return this.policyService.listPolicies(communityId);
  }
}
