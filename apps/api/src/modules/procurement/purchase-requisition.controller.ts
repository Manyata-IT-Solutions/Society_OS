import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PurchaseRequisitionService } from './purchase-requisition.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreatePurchaseRequisitionSchema } from '@community-os/validation';
import { toPurchaseRequisitionDto } from '@community-os/contracts';

@Controller('procurement/requisitions')
@UseGuards(AuthGuard, PermissionGuard)
export class PurchaseRequisitionController {
  constructor(private readonly prService: PurchaseRequisitionService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PROCUREMENT_PR_CREATE)
  async createRequisition(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = CreatePurchaseRequisitionSchema.parse(body);
    const pr = await this.prService.createRequisition(validated as any, actor);
    return toPurchaseRequisitionDto(pr);
  }

  @Post('from-work-order')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PR_CREATE)
  async createFromWorkOrder(@Body() body: any, @CurrentActor() actor: Actor) {
    const pr = await this.prService.createFromWorkOrderShortage(body, actor);
    return toPurchaseRequisitionDto(pr);
  }

  @Post('from-reorder-suggestions')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PR_CREATE)
  async createFromReorderSuggestions(@Body() body: any, @CurrentActor() actor: Actor) {
    const pr = await this.prService.createFromReorderSuggestions(body, actor);
    return toPurchaseRequisitionDto(pr);
  }

  @Get()
  @RequirePermission(PERMISSIONS.PROCUREMENT_PR_VIEW)
  async listRequisitions(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: any,
    @Query('requestType') requestType?: any,
    @Query('priority') priority?: any,
    @Query('sourceType') sourceType?: any,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const result = await this.prService.listRequisitions({
      organizationId,
      communityId,
      status,
      requestType,
      priority,
      sourceType,
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: result.items.map(toPurchaseRequisitionDto),
      total: result.total,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PR_VIEW)
  async getRequisition(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const pr = await this.prService.getRequisition(id, organizationId);
    return toPurchaseRequisitionDto(pr);
  }

  @Post(':id/submit')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PR_SUBMIT)
  async submitRequisition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('organizationId') organizationId: string,
    @CurrentActor() actor: Actor,
  ) {
    const pr = await this.prService.submitRequisition(id, organizationId, actor);
    return toPurchaseRequisitionDto(pr);
  }

  @Post(':id/approve')
  @RequirePermission(PERMISSIONS.PROCUREMENT_PR_APPROVE)
  async approveRequisition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('organizationId') organizationId: string,
    @CurrentActor() actor: Actor,
  ) {
    const pr = await this.prService.approveRequisition(id, organizationId, actor);
    return toPurchaseRequisitionDto(pr);
  }
}
