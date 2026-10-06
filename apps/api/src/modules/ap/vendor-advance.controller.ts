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
import { VendorAdvanceService } from './vendor-advance.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/advances')
@UseGuards(AuthGuard, PermissionGuard)
export class VendorAdvanceController {
  constructor(private readonly advanceService: VendorAdvanceService) {}

  @Post()
  @RequirePermission(PERMISSIONS.AP_ADVANCE_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentActor() actor: any) {
    return this.advanceService.createAdvance(body, actor);
  }

  @Post(':id/allocate')
  @RequirePermission(PERMISSIONS.AP_ADVANCE_ALLOCATE)
  @HttpCode(HttpStatus.OK)
  async allocate(
    @Param('id') id: string,
    @Body() body: { supplierInvoiceId: string; amount: number },
  ) {
    await this.advanceService.allocateAdvance(id, body.supplierInvoiceId, body.amount);
    return { data: { success: true } };
  }

  @Get()
  @RequirePermission(PERMISSIONS.AP_VENDOR_LEDGER_VIEW)
  async list(@Query('accountingEntityId') accountingEntityId: string) {
    return this.advanceService.list(accountingEntityId);
  }
}
