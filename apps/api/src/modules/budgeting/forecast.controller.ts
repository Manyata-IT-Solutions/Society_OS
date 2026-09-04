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
import { ForecastingService } from './forecasting.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('forecasts')
@UseGuards(AuthGuard, PermissionGuard)
export class ForecastController {
  constructor(private readonly forecastService: ForecastingService) {}

  @Post()
  @RequirePermission(PERMISSIONS.BUDGET_FORECAST_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentActor() actor: any) {
    return this.forecastService.generateForecast(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_FORECAST_VIEW)
  async list(
    @Query('accountingEntityId') accountingEntityId: string,
    @Query('fiscalYearId') fiscalYearId?: string,
  ) {
    return this.forecastService.listForecasts(accountingEntityId, fiscalYearId);
  }
}
