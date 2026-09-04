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
import { VarianceAnalysisService } from './variance-analysis.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('variance')
@UseGuards(AuthGuard, PermissionGuard)
export class VarianceController {
  constructor(private readonly varianceService: VarianceAnalysisService) {}

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_VARIANCE_VIEW)
  async getReport(@Query('budgetId') budgetId: string) {
    return this.varianceService.getVarianceReport(budgetId);
  }

  @Post('explanations')
  @RequirePermission(PERMISSIONS.BUDGET_VARIANCE_COMMENT)
  @HttpCode(HttpStatus.CREATED)
  async addExplanation(@Body() body: any, @CurrentActor() actor: any) {
    return this.varianceService.addExplanation(body, actor);
  }
}
