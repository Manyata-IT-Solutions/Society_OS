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
import { CapexPlanningService } from './capex-planning.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('capex')
@UseGuards(AuthGuard, PermissionGuard)
export class CapexController {
  constructor(private readonly capexService: CapexPlanningService) {}

  @Post()
  @RequirePermission(PERMISSIONS.BUDGET_CAPEX_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentActor() actor: any) {
    return this.capexService.createInitiative(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_CAPEX_VIEW)
  async list(@Query('communityId') communityId: string) {
    return this.capexService.listInitiatives(communityId);
  }

  @Post(':id/progress')
  @RequirePermission(PERMISSIONS.BUDGET_CAPEX_MANAGE)
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @Param('id') id: string,
    @Body('progressPercent') progressPercent: number,
    @Body('forecastCost') forecastCost?: number,
  ) {
    return this.capexService.updateProgress(id, progressPercent, forecastCost);
  }
}
