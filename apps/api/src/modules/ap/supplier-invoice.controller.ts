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
import { SupplierInvoiceService } from './supplier-invoice.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/invoices')
@UseGuards(AuthGuard, PermissionGuard)
export class SupplierInvoiceController {
  constructor(private readonly invoiceService: SupplierInvoiceService) {}

  @Post()
  @RequirePermission(PERMISSIONS.AP_INVOICE_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentActor() actor: any) {
    return this.invoiceService.createInvoice(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.AP_INVOICE_VIEW)
  async list(@Query() query: any) {
    return this.invoiceService.list(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.AP_INVOICE_VIEW)
  async getById(@Param('id') id: string) {
    return this.invoiceService.findById(id);
  }

  @Post(':id/match')
  @RequirePermission(PERMISSIONS.AP_INVOICE_MATCH)
  @HttpCode(HttpStatus.OK)
  async match(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.invoiceService.submitAndMatch(id, actor);
  }

  @Post(':id/post')
  @RequirePermission(PERMISSIONS.AP_INVOICE_POST)
  @HttpCode(HttpStatus.OK)
  async postToGl(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.invoiceService.postToGeneralLedger(id, actor);
  }

  @Post(':id/hold')
  @RequirePermission(PERMISSIONS.AP_INVOICE_HOLD)
  @HttpCode(HttpStatus.OK)
  async setHold(
    @Param('id') id: string,
    @Body() body: { hold: boolean; reason?: any; notes?: string },
    @CurrentActor() actor: any,
  ) {
    return this.invoiceService.setPaymentHold(id, body.hold, body.reason, body.notes, actor);
  }
}
