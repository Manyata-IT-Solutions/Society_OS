import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { MeetingMinutesService } from './meeting-minutes.service.js';
import { GenerateMinutesDraftDto, ApproveMinutesDto } from '@community-os/contracts';

@Controller('governance/minutes')
@UseGuards(AuthGuard)
export class GovernanceMinutesController {
  constructor(private readonly minutesService: MeetingMinutesService) {}

  @Post('generate-draft')
  async generateDraft(@Body() dto: GenerateMinutesDraftDto, @Req() req: any) {
    return this.minutesService.generateStructuredMinutesDraft({
      ...dto,
      preparedByUserId: req.user?.id,
    });
  }

  @Post('approve')
  async approveMinutes(@Body() dto: ApproveMinutesDto, @Req() req: any) {
    return this.minutesService.approveAndPublishMinutes({
      ...dto,
      approvedByUserId: req.user?.id,
    });
  }
}
