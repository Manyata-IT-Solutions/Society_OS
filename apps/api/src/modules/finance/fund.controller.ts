import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FundService } from './fund.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreateFundSchema, UpdateFundSchema } from '@community-os/validation';
import { toFundResponseDto } from '@community-os/contracts';

@Controller('finance/funds')
@UseGuards(AuthGuard, PermissionGuard)
export class FundController {
  constructor(private readonly fundService: FundService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FINANCE_FUND_MANAGE)
  async createFund(@Body() body: any, @CurrentActor() actor: Actor) {
    const validated = CreateFundSchema.parse(body);
    const fund = await this.fundService.createFund(validated, actor);
    return toFundResponseDto(fund);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FINANCE_FUND_VIEW)
  async getFund(@Param('id', ParseUUIDPipe) id: string) {
    const fund = await this.fundService.getFund(id);
    return toFundResponseDto(fund);
  }

  @Get()
  @RequirePermission(PERMISSIONS.FINANCE_FUND_VIEW)
  async listFunds(@Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string) {
    const list = await this.fundService.listFunds(accountingEntityId);
    return list.map(toFundResponseDto);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.FINANCE_FUND_MANAGE)
  async updateFund(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    const validated = UpdateFundSchema.parse(body);
    const fund = await this.fundService.updateFund(id, validated);
    return toFundResponseDto(fund);
  }
}
