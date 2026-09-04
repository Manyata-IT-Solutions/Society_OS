import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernanceResolutionService } from './governance-resolution.service.js';
import { AdoptResolutionDto } from '@community-os/contracts';

@Controller('governance/resolutions')
@UseGuards(AuthGuard)
export class GovernanceResolutionsController {
  constructor(private readonly resolutionService: GovernanceResolutionService) {}

  @Post()
  async adoptResolution(@Body() dto: AdoptResolutionDto) {
    return this.resolutionService.adoptResolution(dto);
  }

  @Get()
  async listResolutions(
    @Query('communityId') communityId: string,
    @Query('classification') classification?: string,
  ) {
    return this.resolutionService.listResolutions(communityId, classification);
  }
}
