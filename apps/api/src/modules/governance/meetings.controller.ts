import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { GovernanceMeetingService } from './governance-meeting.service.js';
import { MeetingNoticeService } from './meeting-notice.service.js';
import { CreateMeetingDto, PublishMeetingNoticeDto } from '@community-os/contracts';

@Controller('governance/meetings')
@UseGuards(AuthGuard)
export class GovernanceMeetingsController {
  constructor(
    private readonly meetingService: GovernanceMeetingService,
    private readonly noticeService: MeetingNoticeService,
  ) {}

  @Post()
  async createMeeting(@Body() dto: CreateMeetingDto) {
    return this.meetingService.createMeeting(dto);
  }

  @Get()
  async listMeetings(
    @Query('communityId') communityId: string,
    @Query('meetingType') meetingType?: string,
    @Query('status') status?: string,
  ) {
    return this.meetingService.listMeetings(communityId, { meetingType, status });
  }

  @Get(':id')
  async getMeetingById(@Param('id') id: string) {
    return this.meetingService.getMeetingById(id);
  }

  @Post('notices/publish')
  async publishNotice(@Body() dto: PublishMeetingNoticeDto, @Req() req: any) {
    return this.noticeService.publishMeetingNotice(dto, req.user?.id);
  }

  @Post(':id/start')
  async startMeeting(@Param('id') id: string) {
    return this.meetingService.startMeeting(id);
  }

  @Post(':id/complete')
  async completeMeeting(@Param('id') id: string) {
    return this.meetingService.completeMeeting(id);
  }

  @Post(':id/adjourn')
  async adjournMeeting(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.meetingService.adjournMeeting(id, reason);
  }
}
