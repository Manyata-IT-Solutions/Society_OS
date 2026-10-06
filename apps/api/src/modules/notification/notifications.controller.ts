import { Controller, Get, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service.js';
import { NotificationRepository } from './notification.repository.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import { PERMISSIONS } from '@community-os/auth';
import type { Actor } from '@community-os/types';
import { sendNotificationSchema } from '@community-os/validation';
import {
  toNotificationResponseDto,
  toNotificationDeliveryResponseDto,
  type NotificationResponseDto,
  type NotificationDeliveryResponseDto,
} from '@community-os/contracts';

@ApiTags('Notifications - Broadcast & Dispatch')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationRepo: NotificationRepository,
    private readonly authService: AuthorizationService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Send targeted notification to users, residents, or roles' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification queued' })
  async sendNotification(
    @Body() body: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{ notification: NotificationResponseDto; recipientCount: number }> {
    const validated = sendNotificationSchema.parse(body);

    await this.authService.enforce(actor, PERMISSIONS.NOTIFICATION_SEND, {
      scopeType: validated.communityId ? 'COMMUNITY' : 'PLATFORM',
      scopeId: validated.communityId || null,
    });

    const result = await this.notificationService.sendNotification(validated, actor);
    return {
      notification: toNotificationResponseDto(result.notification),
      recipientCount: result.recipientCount,
    };
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Inspect notification delivery logs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Delivery logs list' })
  async listDeliveries(
    @CurrentActor() actor: Actor,
  ): Promise<{ items: NotificationDeliveryResponseDto[] }> {
    await this.authService.enforce(actor, PERMISSIONS.NOTIFICATION_VIEW_DELIVERY, {
      scopeType: 'PLATFORM',
      scopeId: null,
    });

    const deliveries = await this.notificationRepo.findPendingDeliveries(100);
    return {
      items: deliveries.map((d) => toNotificationDeliveryResponseDto(d)),
    };
  }
}
