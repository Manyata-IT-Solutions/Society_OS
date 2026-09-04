import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { WorkforceRosterService } from './workforce-roster.service.js';
import { CreateRosterDto, AssignShiftDto, ShiftSwapRequestDto } from '@community-os/contracts';

@Controller('workforce/rosters')
@UseGuards(AuthGuard)
export class RostersController {
  constructor(private readonly rosterService: WorkforceRosterService) {}

  @Post()
  async createRoster(@Body() dto: CreateRosterDto, @Req() req: any) {
    return this.rosterService.createRoster(dto, req.user?.sub || req.user?.id);
  }

  @Post(':id/publish')
  async publishRoster(@Param('id') id: string, @Req() req: any) {
    return this.rosterService.publishRoster(id, req.user?.sub || req.user?.id);
  }

  @Post('assignments')
  async assignShift(@Body() dto: AssignShiftDto) {
    return this.rosterService.assignShift(dto);
  }

  @Post('swaps/request')
  async requestShiftSwap(@Body() dto: ShiftSwapRequestDto) {
    return this.rosterService.requestShiftSwap(dto);
  }

  @Post('swaps/:id/approve')
  async approveShiftSwap(@Param('id') id: string, @Req() req: any) {
    return this.rosterService.approveShiftSwap(id, req.user?.sub || req.user?.id);
  }

  @Get()
  async getRosters(@Query('communityId') communityId: string) {
    return this.rosterService.getRosters(communityId);
  }
}
