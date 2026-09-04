import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { Actor } from '@community-os/types';
import { InvoiceService } from './invoice.service.js';
import { toInvoiceResponseDto, InvoiceResponseDto } from '@community-os/contracts';

@Controller('billing/invoices')
@UseGuards(AuthGuard, PermissionGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':id')
  @RequirePermission(PERMISSIONS.BILLING_INVOICE_VIEW)
  async getById(@Param('id') id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceService.getInvoice(id);
    return toInvoiceResponseDto(invoice);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BILLING_INVOICE_VIEW)
  async list(
    @Query('communityId') communityId: string,
    @Query('billableAccountId') billableAccountId?: string,
    @Query('billingPeriodId') billingPeriodId?: string,
    @Query('status') status?: string,
  ): Promise<InvoiceResponseDto[]> {
    const [items] = await this.invoiceService.listInvoices({
      communityId,
      billableAccountId,
      billingPeriodId,
      status,
    });
    return items.map(toInvoiceResponseDto);
  }

  @Post(':id/issue')
  @RequirePermission(PERMISSIONS.BILLING_RUN_ISSUE)
  async issue(@Param('id') id: string, @CurrentActor() actor: Actor): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceService.issueInvoice(id, actor);
    return toInvoiceResponseDto(invoice);
  }

  @Post(':id/cancel')
  @RequirePermission(PERMISSIONS.BILLING_INVOICE_CANCEL)
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentActor() actor: Actor,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceService.cancelInvoice(
      id,
      reason || 'Administrative Cancellation',
      actor,
    );
    return toInvoiceResponseDto(invoice);
  }
}
