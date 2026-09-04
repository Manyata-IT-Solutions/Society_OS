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
import { RfqService } from './rfq.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { CreateRfqSchema, ExtendRfqDeadlineSchema } from '@community-os/validation';
import { toRfqDto } from '@community-os/contracts';

@Controller('procurement/rfqs')
@UseGuards(AuthGuard, PermissionGuard)
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PROCUREMENT_RFQ_CREATE)
  async createRfq(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const validated = CreateRfqSchema.parse(body);
    const rfq = await this.rfqService.createRfq(validated as any, actor);
    return toRfqDto(rfq);
  }

  @Get()
  @RequirePermission(PERMISSIONS.PROCUREMENT_RFQ_VIEW)
  async listRfqs(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
    @Query('status') status?: any,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const result = await this.rfqService.listRfqs({
      organizationId,
      communityId,
      status,
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: result.items.map(toRfqDto),
      total: result.total,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PROCUREMENT_RFQ_VIEW)
  async getRfq(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const rfq = await this.rfqService.getRfq(id, organizationId);
    return toRfqDto(rfq);
  }

  @Post(':id/extend')
  @RequirePermission(PERMISSIONS.PROCUREMENT_RFQ_EXTEND)
  async extendDeadline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentActor() actor: Actor,
  ) {
    const validated = ExtendRfqDeadlineSchema.parse(body);
    const rfq = await this.rfqService.extendDeadline(
      id,
      body.organizationId,
      new Date(validated.newDeadline),
      validated.reason,
      actor,
    );
    return toRfqDto(rfq);
  }

  @Post(':id/close')
  @RequirePermission(PERMISSIONS.PROCUREMENT_RFQ_CLOSE)
  async closeRfq(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('organizationId') organizationId: string,
    @CurrentActor() actor: Actor,
  ) {
    const rfq = await this.rfqService.closeRfq(id, organizationId, actor);
    return toRfqDto(rfq);
  }
}
