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
import { FundPlanningService } from './fund-planning.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('fund-plans')
@UseGuards(AuthGuard, PermissionGuard)
export class FundPlanController {
  constructor(private readonly fundPlanningService: FundPlanningService) {}

  @Post()
  @RequirePermission(PERMISSIONS.BUDGET_FUND_PLAN_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createOrUpdate(@Body() body: any) {
    return this.fundPlanningService.createOrUpdatePlan(body);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_FUND_PLAN_VIEW)
  async list(@Query('fiscalYearId') fiscalYearId: string) {
    return this.fundPlanningService.listFundPlans(fiscalYearId);
  }
}
