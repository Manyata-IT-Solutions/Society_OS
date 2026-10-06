import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { VisitorService } from './visitor.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type { InviteVisitorDto, CreateWalkInVisitDto } from '@community-os/contracts';

@Controller('security/visitors')
@UseGuards(AuthGuard)
export class VisitorController {
  constructor(private readonly service: VisitorService) {}

  @Post('invite')
  async inviteVisitor(@Body() dto: InviteVisitorDto, @Req() req: any) {
    return this.service.inviteVisitor(dto, req.user?.id);
  }

  @Post('walk-in')
  async createWalkIn(@Body() dto: CreateWalkInVisitDto, @Req() req: any) {
    return this.service.createWalkIn(dto, req.user?.id);
  }

  @Post('passes/:id/revoke')
  async revokePass(@Param('id') id: string, @Req() req: any) {
    return this.service.revokePass(id, req.user?.id);
  }
}
