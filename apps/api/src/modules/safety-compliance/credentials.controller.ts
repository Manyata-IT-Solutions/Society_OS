import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ComplianceCredentialService } from './compliance-credential.service.js';
import {
  CreateComplianceCredentialDto,
  RenewComplianceCredentialDto,
} from '@community-os/contracts';

@Controller('safety/credentials')
@UseGuards(AuthGuard)
export class ComplianceCredentialsController {
  constructor(private readonly credService: ComplianceCredentialService) {}

  @Post()
  async createCredential(@Body() dto: CreateComplianceCredentialDto) {
    return this.credService.createCredential(dto);
  }

  @Post('renew')
  async renewCredential(@Body() dto: RenewComplianceCredentialDto) {
    return this.credService.renewCredential(dto);
  }

  @Get()
  async listCredentials(@Query('communityId') communityId: string) {
    return this.credService.listCredentials(communityId);
  }
}
