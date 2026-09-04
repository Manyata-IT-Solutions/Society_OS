import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BudgetAmendmentService } from './budget-amendment.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('budget-amendments')
@UseGuards(AuthGuard, PermissionGuard)
export class BudgetAmendmentController {
  constructor(private readonly amendmentService: BudgetAmendmentService) {}

  @Post()
  @RequirePermission(PERMISSIONS.BUDGET_AMENDMENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentActor() actor: any) {
    return this.amendmentService.createAmendment(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_VIEW)
  async list(@Query('budgetId') budgetId: string) {
    return this.amendmentService.listAmendments(budgetId);
  }
}
