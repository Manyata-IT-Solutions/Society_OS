import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { VisitApprovalService } from './visit-approval.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type { DecideVisitApprovalDto } from '@community-os/contracts';

@Controller('security/approvals')
@UseGuards(AuthGuard)
export class VisitApprovalController {
  constructor(private readonly service: VisitApprovalService) {}

  @Post('decide')
  async decideApproval(@Body() dto: DecideVisitApprovalDto, @Req() req: any) {
    return this.service.decideApproval(dto, req.user?.id);
  }

  @Get('pending')
  async getPendingApprovals(@Query('communityId') communityId: string) {
    return this.service.getPendingApprovals(communityId);
  }
}
