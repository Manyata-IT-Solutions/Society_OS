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
import { GoodsReceiptNoteService } from './goods-receipt-note.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreateGoodsReceiptNoteSchema, RecordGrnInspectionSchema } from '@community-os/validation';
import { toGoodsReceiptNoteDto } from '@community-os/contracts';

@Controller('procurement/receipts')
@UseGuards(AuthGuard, PermissionGuard)
export class GoodsReceiptNoteController {
  constructor(private readonly grnService: GoodsReceiptNoteService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PROCUREMENT_GRN_CREATE)
  async createGrn(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = CreateGoodsReceiptNoteSchema.parse(body);
    const grn = await this.grnService.createGrn(validated as any, actor);
    return toGoodsReceiptNoteDto(grn);
  }

  @Get()
  @RequirePermission(PERMISSIONS.PROCUREMENT_GRN_VIEW)
  async listGrns(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('purchaseOrderId') purchaseOrderId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('storeId') storeId?: string,
    @Query('status') status?: any,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const result = await this.grnService.listGrns({
      organizationId,
      communityId,
      purchaseOrderId,
      vendorId,
      storeId,
      status,
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: result.items.map(toGoodsReceiptNoteDto),
      total: result.total,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROCUREMENT_GRN_VIEW)
  async getGrn(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const grn = await this.grnService.getGrn(id, organizationId);
    return toGoodsReceiptNoteDto(grn);
  }

  @Post(':id/inspect')
  @RequirePermission(PERMISSIONS.PROCUREMENT_GRN_INSPECT)
  async recordInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = RecordGrnInspectionSchema.parse(body);
    const grn = await this.grnService.recordInspection(id, validated as any, actor);
    return toGoodsReceiptNoteDto(grn);
  }

  @Post(':id/post')
  @RequirePermission(PERMISSIONS.PROCUREMENT_GRN_POST)
  async postGrnToInventory(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
    const grn = await this.grnService.postGrnToInventory(id, actor);
    return toGoodsReceiptNoteDto(grn);
  }
}
