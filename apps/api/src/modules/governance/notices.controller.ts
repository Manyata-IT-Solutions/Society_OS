import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernanceNoticeService } from './governance-notice.service.js';
import { GovernanceAcknowledgementService } from './governance-acknowledgement.service.js';
import { CreateGovernanceNoticeDto, AcknowledgeNoticeDto } from '@community-os/contracts';

@Controller('governance/notices')
@UseGuards(AuthGuard)
export class GovernanceNoticesController {
  constructor(
    private readonly noticeService: GovernanceNoticeService,
    private readonly ackService: GovernanceAcknowledgementService,
  ) {}

  @Post()
  async publishNotice(@Body() dto: CreateGovernanceNoticeDto, @Req() req: any) {
    return this.noticeService.publishNotice(dto, req.user?.id, req.user?.id);
  }

  @Get()
  async listNotices(
    @Query('communityId') communityId: string,
    @Query('noticeType') noticeType?: string,
  ) {
    return this.noticeService.listNotices(communityId, noticeType);
  }

  @Post(':id/read')
  async recordRead(
    @Param('id') id: string,
    @Body('residentId') residentId?: string,
    @Req() req?: any,
  ) {
    return this.ackService.recordNoticeRead(id, residentId, req?.user?.id);
  }

  @Post('acknowledge')
  async acknowledgeNotice(@Body() dto: AcknowledgeNoticeDto, @Req() req: any) {
    return this.ackService.acknowledgeNotice(dto, req.user?.id);
  }
}
