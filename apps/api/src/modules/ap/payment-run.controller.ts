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
import { PaymentRunService } from './payment-run.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/payment-runs')
@UseGuards(AuthGuard, PermissionGuard)
export class PaymentRunController {
  constructor(private readonly paymentRunService: PaymentRunService) {}

  @Post()
  @RequirePermission(PERMISSIONS.AP_PAYMENT_RUN_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createFromProposal(@Body('proposalId') proposalId: string, @CurrentActor() actor: any) {
    return this.paymentRunService.createPaymentRunFromProposal(proposalId, actor);
  }

  @Post(':id/execute')
  @RequirePermission(PERMISSIONS.AP_PAYMENT_EXECUTE)
  @HttpCode(HttpStatus.OK)
  async execute(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.paymentRunService.executePaymentRun(id, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.AP_PAYMENT_RUN_VIEW)
  async list(@Query('accountingEntityId') accountingEntityId: string) {
    return this.paymentRunService.list(accountingEntityId);
  }
}
