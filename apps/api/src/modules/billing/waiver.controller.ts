import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { Actor } from '@community-os/types';
import { WaiverService } from './waiver.service.js';
import {
  CreateWaiverRequestSchema,
  ApproveWaiverSchema,
  CreateCreditNoteSchema,
} from '@community-os/validation';

@Controller('billing/waivers')
@UseGuards(AuthGuard, PermissionGuard)
export class WaiverController {
  constructor(private readonly waiverService: WaiverService) {}

  @Post('credit-notes')
  @RequirePermission(PERMISSIONS.BILLING_CREDITNOTE_MANAGE)
  async createCreditNote(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const data = CreateCreditNoteSchema.parse(body);
    return this.waiverService.createCreditNote(data, actor);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.BILLING_WAIVER_APPROVE)
  async approveWaiver(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ) {
    const data = ApproveWaiverSchema.parse(body);
    return this.waiverService.approveWaiver(
      id,
      data.approved,
      data.rejectionReason || undefined,
      actor,
    );
  }

  @Post()
  @RequirePermission(PERMISSIONS.BILLING_WAIVER_REQUEST)
  async requestWaiver(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const data = CreateWaiverRequestSchema.parse(body);
    return this.waiverService.createWaiverRequest(data, actor);
  }
}
