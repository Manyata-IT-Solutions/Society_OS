import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BankReconciliationEngine } from './bank-reconciliation.engine.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('treasury/reconciliation')
@UseGuards(AuthGuard, PermissionGuard)
export class BankReconciliationController {
  constructor(private readonly reconEngine: BankReconciliationEngine) {}

  @Post('sessions')
  @RequirePermission(PERMISSIONS.TREASURY_RECONCILIATION_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() body: any, @CurrentActor() actor: any) {
    return this.reconEngine.createSession(body, actor);
  }

  @Get('sessions/:id')
  @RequirePermission(PERMISSIONS.TREASURY_RECONCILIATION_VIEW)
  async getSession(@Param('id') id: string) {
    return this.reconEngine.getSessionById(id);
  }

  @Post('sessions/:id/auto-match')
  @RequirePermission(PERMISSIONS.TREASURY_BANK_MATCH_MANAGE)
  @HttpCode(HttpStatus.OK)
  async autoMatch(@Param('id') id: string) {
    return this.reconEngine.runAutoMatch(id);
  }

  @Post('matches/manual')
  @RequirePermission(PERMISSIONS.TREASURY_BANK_MATCH_MANAGE)
  @HttpCode(HttpStatus.OK)
  async manualMatch(@Body() body: any, @CurrentActor() actor: any) {
    return this.reconEngine.manualMatch(body, actor);
  }

  @Post('bank-fee')
  @RequirePermission(PERMISSIONS.TREASURY_BANK_MATCH_MANAGE)
  @HttpCode(HttpStatus.OK)
  async postBankFee(@Body() body: any, @CurrentActor() actor: any) {
    return this.reconEngine.postBankFeeJournal(body, actor);
  }

  @Post('sessions/:id/complete')
  @RequirePermission(PERMISSIONS.TREASURY_RECONCILIATION_COMPLETE)
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id') id: string,
    @Body('allowDifferenceOverride') allowDifferenceOverride: boolean,
    @Body('overrideReason') overrideReason: string,
    @CurrentActor() actor: any,
  ) {
    return this.reconEngine.completeSession(id, actor, allowDifferenceOverride, overrideReason);
  }

  @Post('sessions/:id/reopen')
  @RequirePermission(PERMISSIONS.TREASURY_RECONCILIATION_REOPEN)
  @HttpCode(HttpStatus.OK)
  async reopen(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentActor() actor: any,
  ) {
    return this.reconEngine.reopenSession(id, reason, actor);
  }
}
