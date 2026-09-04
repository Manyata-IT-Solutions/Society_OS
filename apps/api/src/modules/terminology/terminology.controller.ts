import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TerminologyService } from './terminology.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type { TerminologySettingsResponseDto } from '@community-os/contracts';

@ApiTags('Terminology')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('terminology')
export class TerminologyController {
  constructor(private readonly terminologyService: TerminologyService) {}

  @Get()
  @ApiOperation({ summary: 'Resolve community display terminology' })
  async getTerminology(
    @Query('organizationId') organizationId: string | undefined,
    @Query('communityId') communityId: string | undefined,
  ): Promise<TerminologySettingsResponseDto> {
    return this.terminologyService.getTerminology({
      organizationId: organizationId || null,
      communityId: communityId || null,
    });
  }
}
