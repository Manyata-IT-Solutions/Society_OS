import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { BudgetControlEngine } from './budget-control.engine.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('budget-control')
@UseGuards(AuthGuard, PermissionGuard)
export class BudgetControlController {
  constructor(private readonly controlEngine: BudgetControlEngine) {}

  @Post('check')
  @RequirePermission(PERMISSIONS.BUDGET_CONTROL_VIEW)
  @HttpCode(HttpStatus.OK)
  async check(@Body() body: any) {
    return this.controlEngine.checkBudget(body);
  }

  @Post('spend')
  @RequirePermission(PERMISSIONS.BUDGET_COMMITMENT_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async executeSpend(@Body() body: any, @CurrentActor() actor: any) {
    return this.controlEngine.executeSpendControl(body, actor);
  }
}
