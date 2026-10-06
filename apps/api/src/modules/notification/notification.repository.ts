import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  Notification,
  NotificationDelivery,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
} from '@community-os/types';
import type { Prisma } from '@prisma/client';

export interface CreateNotificationRecordInput {
  organizationId?: string | null;
  communityId?: string | null;
  templateId?: string | null;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  targetUrl?: string | null;
  metadata?: Record<string, unknown>;
  scheduledAt?: Date | null;
  expiresAt?: Date | null;
  deduplicationKey?: string | null;
  createdById?: string | null;
  recipients: Array<{
    userId?: string | null;
    residentId?: string | null;
    recipientType: string;
    channels: Array<{
      channel: NotificationChannel;
      destination?: string | null;
      idempotencyKey?: string | null;
    }>;
  }>;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDeduplicationKey(deduplicationKey: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findFirst({
      where: { deduplicationKey },
    });
    return notification as unknown as Notification | null;
  }

  async createNotificationWithRecipients(
    input: CreateNotificationRecordInput,
  ): Promise<{ notification: Notification; recipientCount: number }> {
    return this.prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: {
          organizationId: input.organizationId || null,
          communityId: input.communityId || null,
          templateId: input.templateId || null,
          type: input.type,
          category: input.category,
          priority: input.priority,
          title: input.title,
          body: input.body,
          targetUrl: input.targetUrl || null,
          metadata: (input.metadata as Prisma.InputJsonValue) || {},
          status: 'QUEUED',
          scheduledAt: input.scheduledAt || null,
          expiresAt: input.expiresAt || null,
          deduplicationKey: input.deduplicationKey || null,
          createdById: input.createdById || null,
        },
      });

      for (const rec of input.recipients) {
        const recipient = await tx.notificationRecipient.create({
          data: {
            notificationId: notification.id,
            userId: rec.userId || null,
            residentId: rec.residentId || null,
            recipientType: rec.recipientType,
            isRead: false,
          },
        });

        for (const ch of rec.channels) {
          await tx.notificationDelivery.create({
            data: {
              recipientId: recipient.id,
              channel: ch.channel,
              destination: ch.destination || null,
              status: 'QUEUED',
              attemptCount: 0,
              maxAttempts: 3,
              idempotencyKey: ch.idempotencyKey || null,
            },
          });
        }
      }

      return {
        notification: notification as unknown as Notification,
        recipientCount: input.recipients.length,
      };
    });
  }

  async findUserInbox(
    userId: string,
    params: {
      category?: NotificationCategory;
      isRead?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    items: Array<{ notification: Notification; isRead: boolean; readAt: Date | null }>;
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationRecipientWhereInput = {
      userId,
      ...(params.isRead !== undefined && { isRead: params.isRead }),
      ...(params.category && {
        notification: { category: params.category },
      }),
    };

    const [recipientRecords, total, unreadCount] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { notification: true },
      }),
      this.prisma.notificationRecipient.count({ where }),
      this.prisma.notificationRecipient.count({
        where: { userId, isRead: false },
      }),
    ]);

    const items = recipientRecords.map((r) => ({
      notification: r.notification as unknown as Notification,
      isRead: r.isRead,
      readAt: r.readAt,
    }));

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notificationRecipient.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(recipientId: string, userId: string): Promise<boolean> {
    const res = await this.prisma.notificationRecipient.updateMany({
      where: { id: recipientId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return res.count > 0;
  }

  async markNotificationAsReadForUser(notificationId: string, userId: string): Promise<boolean> {
    const res = await this.prisma.notificationRecipient.updateMany({
      where: { notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return res.count > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const res = await this.prisma.notificationRecipient.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return res.count;
  }

  async findPendingDeliveries(batchSize = 50): Promise<NotificationDelivery[]> {
    const deliveries = await this.prisma.notificationDelivery.findMany({
      where: {
        status: { in: ['QUEUED', 'FAILED'] },
        attemptCount: { lt: 3 },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });
    return deliveries as unknown as NotificationDelivery[];
  }

  async updateDeliveryStatus(
    id: string,
    data: {
      status: 'SENT' | 'DELIVERED' | 'FAILED' | 'SKIPPED';
      attemptCount?: number;
      nextAttemptAt?: Date | null;
      lastAttemptAt?: Date | null;
      providerReference?: string | null;
      providerError?: string | null;
      sentAt?: Date | null;
      deliveredAt?: Date | null;
    },
  ): Promise<NotificationDelivery> {
    const delivery = await this.prisma.notificationDelivery.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.attemptCount !== undefined && { attemptCount: data.attemptCount }),
        ...(data.nextAttemptAt !== undefined && { nextAttemptAt: data.nextAttemptAt }),
        ...(data.lastAttemptAt !== undefined && { lastAttemptAt: data.lastAttemptAt }),
        ...(data.providerReference !== undefined && { providerReference: data.providerReference }),
        ...(data.providerError !== undefined && { providerError: data.providerError }),
        ...(data.sentAt !== undefined && { sentAt: data.sentAt }),
        ...(data.deliveredAt !== undefined && { deliveredAt: data.deliveredAt }),
      },
    });
    return delivery as unknown as NotificationDelivery;
  }
}
