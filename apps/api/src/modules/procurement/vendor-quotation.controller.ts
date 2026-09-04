import { Controller, Get, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { VendorQuotationService } from './vendor-quotation.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { RecordVendorQuotationSchema, TechnicalEvaluationSchema } from '@community-os/validation';
import { toVendorQuotationDto } from '@community-os/contracts';

@Controller('procurement/quotations')
@UseGuards(AuthGuard, PermissionGuard)
export class VendorQuotationController {
  constructor(private readonly quoteService: VendorQuotationService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PROCUREMENT_QUOTATION_RECORD)
  async recordQuotation(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = RecordVendorQuotationSchema.parse(body);
    const quote = await this.quoteService.recordQuotation(validated as any, actor);
    return toVendorQuotationDto(quote);
  }

  @Get('by-rfq/:rfqId')
  @RequirePermission(PERMISSIONS.PROCUREMENT_QUOTATION_VIEW)
  async listByRfq(@Param('rfqId', ParseUUIDPipe) rfqId: string) {
    const quotes = await this.quoteService.listQuotationsByRfq(rfqId);
    return quotes.map(toVendorQuotationDto);
  }

  @Get('compare/:rfqId')
  @RequirePermission(PERMISSIONS.PROCUREMENT_QUOTATION_VIEW)
  async getComparisonMatrix(@Param('rfqId', ParseUUIDPipe) rfqId: string) {
    return this.quoteService.getComparisonMatrix(rfqId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROCUREMENT_QUOTATION_VIEW)
  async getQuotation(@Param('id', ParseUUIDPipe) id: string) {
    const quote = await this.quoteService.getQuotation(id);
    return toVendorQuotationDto(quote);
  }

  @Post(':id/evaluate')
  @RequirePermission(PERMISSIONS.PROCUREMENT_QUOTATION_EVALUATE)
  async evaluateTechnicalCompliance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = TechnicalEvaluationSchema.parse(body);
    const quote = await this.quoteService.evaluateTechnicalCompliance(id, validated, actor);
    return toVendorQuotationDto(quote);
  }
}
