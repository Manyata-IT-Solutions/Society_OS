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
import { CostCenterService } from './cost-center.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreateCostCenterSchema, UpdateCostCenterSchema } from '@community-os/validation';
import { toCostCenterResponseDto } from '@community-os/contracts';

@Controller('finance/cost-centers')
@UseGuards(AuthGuard, PermissionGuard)
export class CostCenterController {
  constructor(private readonly ccService: CostCenterService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FINANCE_COST_CENTER_MANAGE)
  async createCostCenter(@Body() body: any, @CurrentActor() actor: Actor) {
    const validated = CreateCostCenterSchema.parse(body);
    const cc = await this.ccService.createCostCenter(validated, actor);
    return toCostCenterResponseDto(cc);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FINANCE_COST_CENTER_VIEW)
  async getCostCenter(@Param('id', ParseUUIDPipe) id: string) {
    const cc = await this.ccService.getCostCenter(id);
    return toCostCenterResponseDto(cc);
  }

  @Get()
  @RequirePermission(PERMISSIONS.FINANCE_COST_CENTER_VIEW)
  async listCostCenters(@Query('accountingEntityId', ParseUUIDPipe) accountingEntityId: string) {
    const list = await this.ccService.listCostCenters(accountingEntityId);
    return list.map(toCostCenterResponseDto);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.FINANCE_COST_CENTER_MANAGE)
  async updateCostCenter(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    const validated = UpdateCostCenterSchema.parse(body);
    const cc = await this.ccService.updateCostCenter(id, validated);
    return toCostCenterResponseDto(cc);
  }
}
