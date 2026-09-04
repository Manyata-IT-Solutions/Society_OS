import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FiscalCalendarService } from './fiscal-calendar.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  CreateFiscalYearSchema,
  ClosePeriodSchema,
  ReopenPeriodSchema,
} from '@community-os/validation';
import { toFiscalYearResponseDto } from '@community-os/contracts';

@Controller('finance/fiscal')
@UseGuards(AuthGuard, PermissionGuard)
export class FiscalCalendarController {
  constructor(private readonly fiscalService: FiscalCalendarService) {}

  @Post('years')
  @RequirePermission(PERMISSIONS.FINANCE_FISCAL_YEAR_MANAGE)
  async createFiscalYear(@Body() body: any, @CurrentActor() actor: Actor) {
    const validated = CreateFiscalYearSchema.parse(body);
    const fy = await this.fiscalService.createFiscalYear(validated, actor);
    return toFiscalYearResponseDto(fy);
  }

  @Get('years')
  @RequirePermission(PERMISSIONS.FINANCE_FISCAL_YEAR_VIEW)
  async listFiscalYears(@Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string) {
    const years = await this.fiscalService.getFiscalYears(accountingEntityId);
    return years.map(toFiscalYearResponseDto);
  }

  @Post('periods/:id/close')
  @RequirePermission(PERMISSIONS.FINANCE_PERIOD_CLOSE)
  async closePeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = ClosePeriodSchema.parse(body);
    const period = await this.fiscalService.closePeriod(
      id,
      validated.mode,
      validated.reason,
      actor,
    );
    return period;
  }

  @Post('periods/:id/reopen')
  @RequirePermission(PERMISSIONS.FINANCE_PERIOD_REOPEN)
  async reopenPeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = ReopenPeriodSchema.parse(body);
    const period = await this.fiscalService.reopenPeriod(id, validated.reason, actor);
    return period;
  }
}
