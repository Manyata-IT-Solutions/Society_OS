import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountingEntityService } from './accounting-entity.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import {
  CreateAccountingEntitySchema,
  UpdateAccountingEntitySchema,
} from '@community-os/validation';
import { toAccountingEntityResponseDto } from '@community-os/contracts';

@Controller('finance/entities')
@UseGuards(AuthGuard, PermissionGuard)
export class AccountingEntityController {
  constructor(private readonly entityService: AccountingEntityService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FINANCE_ENTITY_MANAGE)
  async createEntity(@Body() body: any, @CurrentActor() actor: Actor) {
    const validated = CreateAccountingEntitySchema.parse(body);
    const entity = await this.entityService.createEntity(validated, actor);
    return toAccountingEntityResponseDto(entity);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FINANCE_ENTITY_VIEW)
  async getEntity(@Param('id', ParseUUIDPipe) id: string) {
    const entity = await this.entityService.getEntity(id);
    return toAccountingEntityResponseDto(entity);
  }

  @Get()
  @RequirePermission(PERMISSIONS.FINANCE_ENTITY_VIEW)
  async listEntities(
    @Query('organizationId') organizationId: string,
    @Query('communityId') communityId?: string,
  ) {
    const entities = await this.entityService.listEntities(organizationId, communityId);
    return entities.map(toAccountingEntityResponseDto);
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.FINANCE_ENTITY_MANAGE)
  async updateEntity(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    const validated = UpdateAccountingEntitySchema.parse(body);
    const entity = await this.entityService.updateEntity(id, validated);
    return toAccountingEntityResponseDto(entity);
  }
}
