import { Controller, Get, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ServiceReceiptService } from './service-receipt.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreateServiceReceiptNoteSchema } from '@community-os/validation';
import { toServiceReceiptNoteDto } from '@community-os/contracts';

@Controller('procurement/service-receipts')
@UseGuards(AuthGuard, PermissionGuard)
export class ServiceReceiptController {
  constructor(private readonly srnService: ServiceReceiptService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PROCUREMENT_SERVICE_RECEIPT_CREATE)
  async createServiceReceipt(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = CreateServiceReceiptNoteSchema.parse(body);
    const srn = await this.srnService.createServiceReceipt(validated as any, actor);
    return toServiceReceiptNoteDto(srn);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROCUREMENT_SERVICE_RECEIPT_VIEW)
  async getServiceReceipt(@Param('id', ParseUUIDPipe) id: string) {
    const srn = await this.srnService.getServiceReceipt(id);
    return toServiceReceiptNoteDto(srn);
  }

  @Post(':id/accept')
  @RequirePermission(PERMISSIONS.PROCUREMENT_SERVICE_RECEIPT_ACCEPT)
  async acceptServiceReceipt(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
    const srn = await this.srnService.acceptServiceReceipt(id, actor);
    return toServiceReceiptNoteDto(srn);
  }
}
