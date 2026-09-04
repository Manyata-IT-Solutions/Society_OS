import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { MusterService } from './muster.service.js';
import { ConfirmMusterStatusDto, ResidentSelfSafeDto } from '@community-os/contracts';

@Controller('safety/muster')
@UseGuards(AuthGuard)
export class MusterController {
  constructor(private readonly musterService: MusterService) {}

  @Post('confirm')
  async confirmStatus(@Body() dto: ConfirmMusterStatusDto, @Req() req: any) {
    return this.musterService.confirmStatus(dto, req?.user?.id);
  }

  @Post('self-safe')
  async residentSelfSafe(@Body() dto: ResidentSelfSafeDto) {
    return this.musterService.residentSelfSafe(dto);
  }

  @Get('summary/:sessionId')
  async getSummary(@Param('sessionId') sessionId: string) {
    return this.musterService.getMusterSummary(sessionId);
  }
}
