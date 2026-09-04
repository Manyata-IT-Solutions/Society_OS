import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { BusinessCalendarRepository } from './business-calendar.repository.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type {
  Actor,
  ScopeType,
  BusinessCalendar,
  BusinessCalendarException,
} from '@community-os/types';
import {
  CreateBusinessCalendarSchema,
  UpdateBusinessCalendarSchema,
} from '@community-os/validation';
import { toBusinessCalendarDto, type BusinessCalendarResponseDto } from '@community-os/contracts';
import type { Prisma } from '@prisma/client';

@Controller('calendars')
@UseGuards(AuthGuard, PermissionGuard)
export class BusinessCalendarsController {
  constructor(private readonly calendarRepo: BusinessCalendarRepository) {}

  @Get()
  @RequirePermission(PERMISSIONS.CALENDAR_VIEW)
  async listCalendars(
    @Query('organizationId') organizationId?: string,
    @Query('communityId') communityId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<{ items: BusinessCalendarResponseDto[]; total: number }> {
    const res = await this.calendarRepo.list({
      organizationId,
      communityId,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
    return {
      items: res.items.map((c) => toBusinessCalendarDto(this.mapToDomain(c))),
      total: res.total,
    };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.CALENDAR_VIEW)
  async getCalendar(@Param('id') id: string): Promise<BusinessCalendarResponseDto> {
    const cal = await this.calendarRepo.findById(id);
    if (!cal) {
      throw new NotFoundException(`Business calendar with ID "${id}" not found`);
    }
    return toBusinessCalendarDto(this.mapToDomain(cal));
  }

  @Post()
  @RequirePermission(PERMISSIONS.CALENDAR_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  async createCalendar(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<BusinessCalendarResponseDto> {
    const parsed = CreateBusinessCalendarSchema.parse(body);
    const created = await this.calendarRepo.create({
      key: parsed.key,
      name: parsed.name,
      description: parsed.description,
      scopeType: parsed.scopeType,
      scopeId: parsed.communityId ?? parsed.organizationId ?? null,
      organization: parsed.organizationId ? { connect: { id: parsed.organizationId } } : undefined,
      community: parsed.communityId ? { connect: { id: parsed.communityId } } : undefined,
      timezone: parsed.timezone,
      workingDays: parsed.workingDays,
      workingHours: parsed.workingHours as Prisma.InputJsonValue,
      holidays: parsed.holidays,
      exceptions: parsed.exceptions as unknown as Prisma.InputJsonValue,
      isDefault: parsed.isDefault ?? false,
      createdByUser: actor.id ? { connect: { id: actor.id } } : undefined,
    });
    return toBusinessCalendarDto(this.mapToDomain(created as unknown as Record<string, unknown>));
  }

  @Put(':id')
  @RequirePermission(PERMISSIONS.CALENDAR_MANAGE)
  async updateCalendar(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentActor() _actor: Actor,
  ): Promise<BusinessCalendarResponseDto> {
    const parsed = UpdateBusinessCalendarSchema.parse(body);
    const updated = await this.calendarRepo.update(id, {
      name: parsed.name,
      description: parsed.description,
      timezone: parsed.timezone,
      workingDays: parsed.workingDays,
      workingHours: parsed.workingHours
        ? (parsed.workingHours as Prisma.InputJsonValue)
        : undefined,
      holidays: parsed.holidays,
      exceptions: parsed.exceptions as unknown as Prisma.InputJsonValue,
      isDefault: parsed.isDefault,
    });
    return toBusinessCalendarDto(this.mapToDomain(updated as unknown as Record<string, unknown>));
  }

  private mapToDomain(c: Record<string, unknown>): BusinessCalendar {
    return {
      id: c.id as string,
      key: c.key as string,
      name: c.name as string,
      description: c.description as string | null,
      scopeType: c.scopeType as ScopeType,
      scopeId: c.scopeId as string | null,
      organizationId: c.organizationId as string | null,
      communityId: c.communityId as string | null,
      timezone: c.timezone as string,
      workingDays: (c.workingDays ?? [1, 2, 3, 4, 5]) as number[],
      workingHours: (c.workingHours ?? { start: '09:00', end: '17:00' }) as {
        start: string;
        end: string;
      },
      holidays: (c.holidays ?? []) as string[],
      exceptions: (c.exceptions ?? []) as BusinessCalendarException[],
      isDefault: c.isDefault as boolean,
      createdById: c.createdById as string | null,
      createdAt: c.createdAt as Date,
      updatedAt: c.updatedAt as Date,
    };
  }
}
