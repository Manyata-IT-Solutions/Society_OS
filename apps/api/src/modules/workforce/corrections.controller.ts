import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { AttendanceCorrectionService } from './attendance-correction.service.js';
import { AttendanceCorrectionRequestDto, DecideCorrectionDto } from '@community-os/contracts';

@Controller('workforce/corrections')
@UseGuards(AuthGuard)
export class CorrectionsController {
  constructor(private readonly correctionService: AttendanceCorrectionService) {}

  @Post('request')
  async requestCorrection(@Body() dto: AttendanceCorrectionRequestDto, @Req() req: any) {
    return this.correctionService.requestCorrection(dto, req.user?.sub || req.user?.id);
  }

  @Post('decide')
  async decideCorrection(@Body() dto: DecideCorrectionDto, @Req() req: any) {
    return this.correctionService.decideCorrection(dto, req.user?.sub || req.user?.id);
  }

  @Get('pending')
  async getPendingCorrections(@Query('communityId') communityId?: string) {
    return this.correctionService.getPendingCorrections(communityId);
  }
}
