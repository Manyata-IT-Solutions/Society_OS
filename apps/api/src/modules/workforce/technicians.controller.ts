import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceCapabilityResolver } from './workforce-capability.resolver.js';

@Controller('workforce/technicians')
@UseGuards(AuthGuard)
export class TechniciansController {
  constructor(private readonly capabilityResolver: WorkforceCapabilityResolver) {}

  @Get('resolve')
  async resolveTechnicians(
    @Query('communityId') communityId: string,
    @Query('trade') trade?: string,
    @Query('skillCode') skillCode?: string,
  ) {
    return this.capabilityResolver.resolveTechnicians(communityId, trade, skillCode);
  }
}
