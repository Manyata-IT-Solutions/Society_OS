import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import { Actor } from '@community-os/types';
import { PaymentService } from './payment.service.js';
import { PaymentReversalService } from './payment-reversal.service.js';
import { RecordPaymentSchema, ReversePaymentSchema } from '@community-os/validation';
import { toPaymentResponseDto, PaymentResponseDto } from '@community-os/contracts';

@Controller('billing/payments')
@UseGuards(AuthGuard, PermissionGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly reversalService: PaymentReversalService,
  ) {}

  @Post()
  @RequirePermission(PERMISSIONS.BILLING_PAYMENT_RECORD)
  async record(@Body() body: unknown, @CurrentActor() actor: Actor): Promise<PaymentResponseDto> {
    const data = RecordPaymentSchema.parse(body);
    const payment = await this.paymentService.recordPayment(data, actor);
    return toPaymentResponseDto(payment);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async getById(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.getPayment(id);
    return toPaymentResponseDto(payment);
  }

  @Get()
  @RequirePermission(PERMISSIONS.BILLING_VIEW)
  async list(
    @Query('communityId') communityId: string,
    @Query('billableAccountId') billableAccountId?: string,
  ): Promise<PaymentResponseDto[]> {
    const [items] = await this.paymentService.listPayments({ communityId, billableAccountId });
    return items.map(toPaymentResponseDto);
  }

  @Post(':id/reverse')
  @RequirePermission(PERMISSIONS.BILLING_PAYMENT_REVERSE)
  async reverse(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<PaymentResponseDto> {
    const data = ReversePaymentSchema.parse(body);
    const payment = await this.reversalService.reversePayment(id, data.reason, actor);
    return toPaymentResponseDto(payment);
  }
}
