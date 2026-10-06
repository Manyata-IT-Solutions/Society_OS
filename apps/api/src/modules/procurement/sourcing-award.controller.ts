import { Controller, Get, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { SourcingAwardService } from './sourcing-award.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreateSourcingAwardSchema } from '@community-os/validation';
import { toSourcingAwardDto } from '@community-os/contracts';

@Controller('procurement/awards')
@UseGuards(AuthGuard, PermissionGuard)
export class SourcingAwardController {
  constructor(private readonly awardService: SourcingAwardService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PROCUREMENT_AWARD_RECOMMEND)
  async recommendAward(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = CreateSourcingAwardSchema.parse(body);
    const award = await this.awardService.recommendAward(validated as any, actor);
    return toSourcingAwardDto(award);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.PROCUREMENT_AWARD_APPROVE)
  async approveAward(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
    const award = await this.awardService.approveAward(id, actor);
    return toSourcingAwardDto(award);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROCUREMENT_QUOTATION_VIEW)
  async getAward(@Param('id', ParseUUIDPipe) id: string) {
    const award = await this.awardService.getAward(id);
    return toSourcingAwardDto(award);
  }
}
