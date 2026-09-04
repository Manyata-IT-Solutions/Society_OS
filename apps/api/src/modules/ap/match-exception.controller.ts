import { Controller, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SupplierInvoiceService } from './supplier-invoice.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/exceptions')
@UseGuards(AuthGuard, PermissionGuard)
export class MatchExceptionController {
  constructor(private readonly invoiceService: SupplierInvoiceService) {}

  @Post(':id/resolve')
  @RequirePermission(PERMISSIONS.AP_INVOICE_OVERRIDE_MATCH)
  @HttpCode(HttpStatus.OK)
  async resolve(@Param('id') id: string, @Body() body: any, @CurrentActor() actor: any) {
    return this.invoiceService.resolveException(id, body, actor);
  }
}
