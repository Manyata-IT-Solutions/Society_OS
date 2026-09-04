import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { WatchlistService } from './watchlist.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type { CreateWatchlistEntryDto, SecurityOverrideDto } from '@community-os/contracts';

@Controller('security/watchlist')
@UseGuards(AuthGuard)
export class WatchlistController {
  constructor(private readonly service: WatchlistService) {}

  @Post()
  async createEntry(@Body() dto: CreateWatchlistEntryDto, @Req() req: any) {
    return this.service.createEntry(dto, req.user?.sub || req.user?.id);
  }

  @Get()
  async getEntries(@Query('communityId') communityId: string) {
    return this.service.getEntries(communityId);
  }

  @Post('override')
  async createOverride(@Body() dto: SecurityOverrideDto, @Req() req: any) {
    return this.service.createOverride(dto, req.user?.id);
  }
}
