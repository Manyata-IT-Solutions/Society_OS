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
import { PaymentProposalService } from './payment-proposal.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('ap/payment-proposals')
@UseGuards(AuthGuard, PermissionGuard)
export class PaymentProposalController {
  constructor(private readonly proposalService: PaymentProposalService) {}

  @Post()
  @RequirePermission(PERMISSIONS.AP_PAYMENT_PROPOSAL_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async generate(@Body() body: any, @CurrentActor() actor: any) {
    return this.proposalService.generateProposal(body, actor);
  }

  @Get()
  @RequirePermission(PERMISSIONS.AP_PAYMENT_RUN_VIEW)
  async list(@Query('accountingEntityId') accountingEntityId: string) {
    return this.proposalService.list(accountingEntityId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.AP_PAYMENT_RUN_VIEW)
  async getById(@Param('id') id: string) {
    return this.proposalService.findById(id);
  }
}
