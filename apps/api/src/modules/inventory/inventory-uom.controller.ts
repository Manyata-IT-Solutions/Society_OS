import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { toUnitOfMeasureDto, type UnitOfMeasureResponseDto } from '@community-os/contracts';
import { InventoryUomService } from './inventory-uom.service.js';

@Controller('inventory-uoms')
@UseGuards(AuthGuard, PermissionGuard)
export class InventoryUomController {
  constructor(private readonly uomService: InventoryUomService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_UOM_VIEW)
  async list(@Query('organizationId') organizationId: string): Promise<UnitOfMeasureResponseDto[]> {
    const uoms = await this.uomService.findAll(organizationId);
    return uoms.map(toUnitOfMeasureDto);
  }

  @Post()
  @RequirePermission(PERMISSIONS.INVENTORY_UOM_MANAGE)
  async create(@Body() body: any, @CurrentActor() actor: Actor): Promise<UnitOfMeasureResponseDto> {
    const uom = await this.uomService.create(body, actor);
    return toUnitOfMeasureDto(uom);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.INVENTORY_UOM_VIEW)
  async getById(@Param('id') id: string): Promise<UnitOfMeasureResponseDto> {
    const uom = await this.uomService.findById(id);
    return toUnitOfMeasureDto(uom);
  }
}
