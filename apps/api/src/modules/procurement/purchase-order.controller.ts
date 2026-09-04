import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  CreatePurchaseOrderSchema,
  AmendPurchaseOrderSchema,
  AcknowledgePurchaseOrderSchema,
  ShortClosePurchaseOrderSchema,
} from '@community-os/validation';
import { toPurchaseOrderDto } from '@community-os/contracts';

@Controller('procurement/orders')
@UseGuards(AuthGuard, PermissionGuard)
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_CREATE)
  async createPurchaseOrder(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = CreatePurchaseOrderSchema.parse(body);
    const po = await this.poService.createPurchaseOrder(validated as any, actor);
    return toPurchaseOrderDto(po);
  }

  @Post('from-award/:awardId')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_CREATE)
  async createFromAward(
    @Param('awardId', ParseUUIDPipe) awardId: string,
    @CurrentActor() actor: Actor,
  ) {
    const pos = await this.poService.createFromAward(awardId, actor);
    return pos.map(toPurchaseOrderDto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_VIEW)
  async listPurchaseOrders(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: any,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const result = await this.poService.listPurchaseOrders({
      organizationId,
      communityId,
      vendorId,
      status,
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: result.items.map(toPurchaseOrderDto),
      total: result.total,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_VIEW)
  async getPurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const po = await this.poService.getPurchaseOrder(id, organizationId);
    return toPurchaseOrderDto(po);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_APPROVE)
  async approvePurchaseOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
    const po = await this.poService.approvePurchaseOrder(id, actor);
    return toPurchaseOrderDto(po);
  }

  @Post(':id/issue')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_ISSUE)
  async issuePurchaseOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
    const po = await this.poService.issuePurchaseOrder(id, actor);
    return toPurchaseOrderDto(po);
  }

  @Post(':id/amend')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_AMEND)
  async amendPurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = AmendPurchaseOrderSchema.parse(body);
    const po = await this.poService.amendPurchaseOrder(id, validated as any, actor);
    return toPurchaseOrderDto(po);
  }

  @Post(':id/acknowledge')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_ACKNOWLEDGE)
  async acknowledgePurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = AcknowledgePurchaseOrderSchema.parse(body);
    const po = await this.poService.acknowledgePurchaseOrder(id, validated, actor);
    return toPurchaseOrderDto(po);
  }

  @Post(':id/short-close')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PO_CLOSE)
  async shortClosePurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const { reason } = ShortClosePurchaseOrderSchema.parse(body);
    const po = await this.poService.shortClosePurchaseOrder(id, reason, actor);
    return toPurchaseOrderDto(po);
  }
}
