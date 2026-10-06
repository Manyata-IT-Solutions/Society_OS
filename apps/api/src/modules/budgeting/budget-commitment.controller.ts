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
import { BudgetCommitmentService } from './budget-commitment.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';

@Controller('budget-commitments')
@UseGuards(AuthGuard, PermissionGuard)
export class BudgetCommitmentController {
  constructor(private readonly commitmentService: BudgetCommitmentService) {}

  @Post('reserve')
  @RequirePermission(PERMISSIONS.BUDGET_COMMITMENT_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createReservation(@Body() body: any, @CurrentActor() actor: any) {
    return this.commitmentService.createReservation({
      budgetLineId: body.budgetLineId,
      sourceType: body.sourceType || 'PURCHASE_REQUISITION',
      sourceId: body.sourceId,
      amount: body.amount,
      reference: body.reference,
      notes: body.notes,
      actor,
    });
  }

  @Post('release-reservation/:sourceId')
  @RequirePermission(PERMISSIONS.BUDGET_COMMITMENT_MANAGE)
  @HttpCode(HttpStatus.OK)
  async releaseReservation(@Param('sourceId') sourceId: string) {
    await this.commitmentService.releaseReservation(sourceId);
    return { success: true };
  }

  @Post('convert')
  @RequirePermission(PERMISSIONS.BUDGET_COMMITMENT_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async convert(@Body() body: any, @CurrentActor() actor: any) {
    return this.commitmentService.convertReservationToCommitment({
      budgetLineId: body.budgetLineId,
      reservationSourceId: body.reservationSourceId,
      poId: body.poId,
      poAmount: body.poAmount,
      reference: body.reference,
      actor,
    });
  }

  @Post('adjust')
  @RequirePermission(PERMISSIONS.BUDGET_COMMITMENT_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async adjust(@Body() body: any, @CurrentActor() actor: any) {
    return this.commitmentService.adjustCommitment({
      poId: body.poId,
      newAmount: body.newAmount,
      reference: body.reference,
      actor,
    });
  }

  @Get()
  @RequirePermission(PERMISSIONS.BUDGET_COMMITMENT_VIEW)
  async list(@Query('budgetLineId') budgetLineId: string) {
    return this.commitmentService.listCommitments(budgetLineId);
  }
}
