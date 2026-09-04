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
import { VendorPaymentService } from './vendor-payment.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/payments')
@UseGuards(AuthGuard, PermissionGuard)
export class VendorPaymentController {
  constructor(private readonly paymentService: VendorPaymentService) {}

  @Post()
  @RequirePermission(PERMISSIONS.AP_PAYMENT_RECORD)
  @HttpCode(HttpStatus.CREATED)
  async recordPayment(@Body() body: any, @CurrentActor() actor: any) {
    return this.paymentService.recordPayment(body, actor);
  }

  @Post(':id/reverse')
  @RequirePermission(PERMISSIONS.AP_PAYMENT_REVERSE)
  @HttpCode(HttpStatus.OK)
  async reversePayment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentActor() actor: any,
  ) {
    return this.paymentService.reversePayment(id, reason, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.AP_PAYMENT_RUN_VIEW)
  async list(@Query('accountingEntityId') accountingEntityId: string) {
    return this.paymentService.list(accountingEntityId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.AP_PAYMENT_RUN_VIEW)
  async getById(@Param('id') id: string) {
    return this.paymentService.findById(id);
  }
}
