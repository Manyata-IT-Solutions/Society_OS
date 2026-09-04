import { Controller, Get, Patch, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationPreferenceRepository } from './notification-preference.repository.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import type { Actor } from '@community-os/types';
import { updateNotificationPreferenceSchema } from '@community-os/validation';
import {
  toNotificationPreferenceResponseDto,
  type NotificationPreferenceResponseDto,
} from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Notifications - Preferences')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('notification-preferences')
export class NotificationPreferencesController {
  constructor(private readonly preferenceRepo: NotificationPreferenceRepository) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notification preferences' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preferences list' })
  async getPreferences(
    @CurrentActor() actor: Actor,
  ): Promise<{ items: NotificationPreferenceResponseDto[] }> {
    if (!actor || !actor.id) {
      throw new DomainException('UNAUTHENTICATED', 'User ID required', HttpStatus.UNAUTHORIZED);
    }

    const prefs = await this.preferenceRepo.findByUserId(actor.id);
    return {
      items: prefs.map((p) => toNotificationPreferenceResponseDto(p)),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update notification preference for a channel and category' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preference updated' })
  async updatePreference(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<NotificationPreferenceResponseDto> {
    if (!actor || !actor.id) {
      throw new DomainException('UNAUTHENTICATED', 'User ID required', HttpStatus.UNAUTHORIZED);
    }

    const validated = updateNotificationPreferenceSchema.parse(body);

    if (validated.category === 'SECURITY' && !validated.isEnabled) {
      throw new DomainException(
        'INVALID_PREFERENCE_OVERRIDE',
        'Security and critical platform alerts cannot be disabled.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const pref = await this.preferenceRepo.upsertPreference(
      actor.id,
      validated.category,
      validated.channel,
      validated.isEnabled,
    );

    return toNotificationPreferenceResponseDto(pref);
  }
}
