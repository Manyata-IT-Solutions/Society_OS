import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BudgetService } from './budget.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('budgets')
@UseGuards(AuthGuard, PermissionGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @RequirePermission(PERMISSIONS.BUDGET_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentActor() actor: any) {
    return this.budgetService.createBudget(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_VIEW)
  async list(
    @Query('accountingEntityId') accountingEntityId: string,
    @Query('fiscalYearId') fiscalYearId?: string,
  ) {
    return this.budgetService.listBudgets(accountingEntityId, fiscalYearId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.BUDGET_VIEW)
  async get(@Param('id') id: string) {
    return this.budgetService.getBudget(id);
  }

  @Post(':id/submit')
  @RequirePermission(PERMISSIONS.BUDGET_SUBMIT)
  @HttpCode(HttpStatus.OK)
  async submit(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.budgetService.submitBudget(id, actor);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.BUDGET_APPROVE)
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.budgetService.approveBudget(id, actor);
  }

  @Post(':id/activate')
  @RequirePermission(PERMISSIONS.BUDGET_ACTIVATE)
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.budgetService.activateBudget(id, actor);
  }

  @Post(':id/copy')
  @RequirePermission(PERMISSIONS.BUDGET_COPY)
  @HttpCode(HttpStatus.CREATED)
  async copyPriorYear(@Param('id') id: string, @Body() body: any, @CurrentActor() actor: any) {
    return this.budgetService.copyPriorYear({
      sourceBudgetId: id,
      targetFiscalYearId: body.targetFiscalYearId,
      name: body.name,
      percentageUplift: body.percentageUplift,
      actor,
    });
  }
}
