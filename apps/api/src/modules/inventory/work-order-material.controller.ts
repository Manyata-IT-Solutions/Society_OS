import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  toWorkOrderMaterialRequirementDto,
  toWorkOrderMaterialConsumptionDto,
  toStockReservationDto,
  toInventoryReturnDto,
  type WorkOrderMaterialRequirementResponseDto,
  type WorkOrderMaterialConsumptionResponseDto,
  type StockReservationResponseDto,
  type InventoryReturnResponseDto,
} from '@community-os/contracts';
import { WorkOrderMaterialService } from './work-order-material.service.js';

@Controller('work-orders/:workOrderId/materials')
@UseGuards(AuthGuard, PermissionGuard)
export class WorkOrderMaterialController {
  constructor(private readonly materialService: WorkOrderMaterialService) {}

  @Get('requirements')
  @RequirePermission(PERMISSIONS.WORK_ORDER_MATERIAL_VIEW)
  async listRequirements(
    @Param('workOrderId') workOrderId: string,
  ): Promise<WorkOrderMaterialRequirementResponseDto[]> {
    const reqs = await this.materialService.getRequirements(workOrderId);
    return reqs.map(toWorkOrderMaterialRequirementDto);
  }

  @Post('requirements')
  @RequirePermission(PERMISSIONS.WORK_ORDER_MATERIAL_REQUEST)
  async createRequirement(
    @Param('workOrderId') workOrderId: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderMaterialRequirementResponseDto> {
    const req = await this.materialService.createRequirement(workOrderId, body, actor);
    return toWorkOrderMaterialRequirementDto(req);
  }

  @Post('reservations')
  @RequirePermission(PERMISSIONS.INVENTORY_STOCK_RESERVE)
  async reserveStock(
    @Param('workOrderId') workOrderId: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<StockReservationResponseDto> {
    const res = await this.materialService.reserveStockForWorkOrder(workOrderId, body, actor);
    return toStockReservationDto(res);
  }

  @Get('consumptions')
  @RequirePermission(PERMISSIONS.WORK_ORDER_MATERIAL_VIEW)
  async listConsumptions(
    @Param('workOrderId') workOrderId: string,
  ): Promise<WorkOrderMaterialConsumptionResponseDto[]> {
    const consumptions = await this.materialService.getConsumptions(workOrderId);
    return consumptions.map(toWorkOrderMaterialConsumptionDto);
  }

  @Post('consumptions')
  @RequirePermission(PERMISSIONS.WORK_ORDER_MATERIAL_CONSUME)
  async recordConsumption(
    @Param('workOrderId') workOrderId: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<WorkOrderMaterialConsumptionResponseDto> {
    const cons = await this.materialService.recordConsumption(workOrderId, body, actor);
    return toWorkOrderMaterialConsumptionDto(cons);
  }

  @Post('returns')
  @RequirePermission(PERMISSIONS.WORK_ORDER_MATERIAL_RETURN)
  async returnUnused(
    @Param('workOrderId') workOrderId: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryReturnResponseDto> {
    const ret = await this.materialService.returnUnusedMaterial(workOrderId, body, actor);
    return toInventoryReturnDto(ret);
  }
}
