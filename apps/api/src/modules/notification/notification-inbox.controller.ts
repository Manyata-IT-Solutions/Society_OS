import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationRepository } from './notification.repository.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentActor } from '../../common/decorators/current-actor.decorator.js';
import type { Actor } from '@community-os/types';
import { notificationQuerySchema } from '@community-os/validation';
import { toNotificationResponseDto, type NotificationResponseDto } from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@ApiTags('Notifications - Inbox')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('notifications/inbox')
export class NotificationInboxController {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  @Get()
  @ApiOperation({ summary: 'Get current user inbox notifications' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notifications list' })
  async getInbox(
    @Query() query: unknown,
    @CurrentActor() actor: Actor,
  ): Promise<{
    items: NotificationResponseDto[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  }> {
    if (!actor || !actor.id) {
      throw new DomainException('UNAUTHENTICATED', 'User ID required', HttpStatus.UNAUTHORIZED);
    }

    const validated = notificationQuerySchema.parse(query);
    const result = await this.notificationRepo.findUserInbox(actor.id, validated);

    return {
      items: result.items.map((i) => toNotificationResponseDto(i.notification, i.isRead, i.readAt)),
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get current user unread notification count' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unread count' })
  async getUnreadCount(@CurrentActor() actor: Actor): Promise<{ count: number }> {
    if (!actor || !actor.id) {
      return { count: 0 };
    }
    const count = await this.notificationRepo.getUnreadCount(actor.id);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark specific notification as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Marked read' })
  async markRead(
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ): Promise<{ success: boolean }> {
    if (!actor || !actor.id) {
      throw new DomainException('UNAUTHENTICATED', 'User ID required', HttpStatus.UNAUTHORIZED);
    }
    const success = await this.notificationRepo.markNotificationAsReadForUser(id, actor.id);
    return { success };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all inbox notifications as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Marked all read' })
  async markAllRead(@CurrentActor() actor: Actor): Promise<{ count: number }> {
    if (!actor || !actor.id) {
      throw new DomainException('UNAUTHENTICATED', 'User ID required', HttpStatus.UNAUTHORIZED);
    }
    const count = await this.notificationRepo.markAllAsRead(actor.id);
    return { count };
  }
}
