import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { NotificationRepository } from './notification.repository.js';
import { NotificationTemplateRepository } from './notification-template.repository.js';
import { NotificationPreferenceRepository } from './notification-preference.repository.js';
import { TemplateEngineService } from './template-engine.service.js';
import { NotificationDeliveryService } from './notification-delivery.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { SendNotificationInput } from '@community-os/validation';
import type {
  Notification,
  NotificationDelivery,
  NotificationChannel,
  Actor,
} from '@community-os/types';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationRepo: NotificationRepository,
    private readonly templateRepo: NotificationTemplateRepository,
    private readonly preferenceRepo: NotificationPreferenceRepository,
    private readonly templateEngine: TemplateEngineService,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Send notification to targeted recipients across selected channels.
   */
  async sendNotification(
    input: SendNotificationInput,
    actor?: Actor,
  ): Promise<{ notification: Notification; recipientCount: number }> {
    // 1. Deduplication Check
    if (input.deduplicationKey) {
      const existing = await this.notificationRepo.findByDeduplicationKey(input.deduplicationKey);
      if (existing) {
        this.logger.log(
          `Notification deduplication key matched: ${input.deduplicationKey}. Returning existing record.`,
          'NotificationService',
        );
        return { notification: existing, recipientCount: 0 };
      }
    }

    // 2. Resolve Template if specified
    let resolvedTitle = input.title;
    let resolvedBody = input.body;
    let templateId: string | null = null;

    if (input.templateCode) {
      const template = await this.templateRepo.findByCode(input.templateCode, input.communityId);
      if (!template) {
        throw new DomainException(
          'NOTIFICATION_TEMPLATE_NOT_FOUND',
          `Notification template with code ${input.templateCode} was not found.`,
          HttpStatus.NOT_FOUND,
        );
      }
      templateId = template.id;
      const rendered = this.templateEngine.renderTemplate(template, input.variables || {});
      resolvedTitle = rendered.title;
      resolvedBody = rendered.body;
    }

    // 3. Resolve Target Recipients
    const resolvedRecipients = await this.resolveRecipients(input);
    if (resolvedRecipients.length === 0) {
      throw new DomainException(
        'INVALID_NOTIFICATION_RECIPIENT',
        'No valid recipients were resolved for this notification target.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. Build Delivery Plans with Preference Filtering
    const channels = (input.channels || ['IN_APP']) as NotificationChannel[];
    const recipientPlans: Array<{
      userId?: string | null;
      residentId?: string | null;
      recipientType: string;
      channels: Array<{
        channel: NotificationChannel;
        destination?: string | null;
        idempotencyKey?: string | null;
      }>;
    }> = [];

    for (const rec of resolvedRecipients) {
      const enabledChannels: Array<{
        channel: NotificationChannel;
        destination?: string | null;
        idempotencyKey?: string | null;
      }> = [];

      for (const ch of channels) {
        let isEnabled = true;
        if (rec.userId) {
          isEnabled = await this.preferenceRepo.isChannelEnabledForUser(
            rec.userId,
            input.category,
            ch,
          );
        }

        if (isEnabled) {
          const destination = ch === 'EMAIL' ? rec.email : ch === 'SMS' ? rec.phone : null;
          enabledChannels.push({
            channel: ch,
            destination,
            idempotencyKey: input.deduplicationKey
              ? `${input.deduplicationKey}-${rec.id}-${ch}`
              : null,
          });
        }
      }

      if (enabledChannels.length > 0) {
        recipientPlans.push({
          userId: rec.userId || null,
          residentId: rec.residentId || null,
          recipientType: rec.recipientType,
          channels: enabledChannels,
        });
      }
    }

    let organizationId: string | null = null;
    if (input.communityId) {
      const comm = await this.prisma.community.findUnique({
        where: { id: input.communityId },
        select: { organizationId: true },
      });
      if (comm) organizationId = comm.organizationId;
    }

    // 5. Persist Notification and Recipient Deliveries Atomically
    const { notification, recipientCount } =
      await this.notificationRepo.createNotificationWithRecipients({
        organizationId,
        communityId: input.communityId || null,
        templateId,
        type: input.templateCode || 'CUSTOM',
        category: input.category,
        priority: input.priority,
        title: resolvedTitle,
        body: resolvedBody,
        targetUrl: input.targetUrl || null,
        metadata: input.metadata || {},
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        deduplicationKey: input.deduplicationKey || null,
        createdById: actor?.id || null,
        recipients: recipientPlans,
      });

    // 6. Asynchronous Delivery Dispatch
    this.dispatchDeliveriesAsync(notification.id, resolvedTitle, resolvedBody).catch((err) => {
      this.logger.error(
        `Error during delivery dispatch: ${(err as Error).message}`,
        'NotificationService',
      );
    });

    // 7. Publish Domain Event
    await this.eventsService.publish(
      createEvent(DOMAIN_EVENT_NAMES.NOTIFICATION_CREATED, {
        notificationId: notification.id,
        communityId: notification.communityId,
        category: notification.category,
        priority: notification.priority,
        recipientCount,
      }),
    );

    return { notification, recipientCount };
  }

  /**
   * Helper to dispatch pending deliveries in background.
   */
  private async dispatchDeliveriesAsync(
    notificationId: string,
    title: string,
    body: string,
  ): Promise<void> {
    const deliveries = await this.prisma.notificationDelivery.findMany({
      where: {
        recipient: { notificationId },
        status: 'QUEUED',
      },
    });

    for (const d of deliveries) {
      await this.deliveryService.processDelivery(d as unknown as NotificationDelivery, title, body);
    }
  }

  /**
   * Resolve individual users/residents from targeted selector.
   */
  private async resolveRecipients(input: SendNotificationInput): Promise<
    Array<{
      id: string;
      userId?: string | null;
      residentId?: string | null;
      recipientType: string;
      email?: string | null;
      phone?: string | null;
    }>
  > {
    const map = new Map<
      string,
      {
        id: string;
        userId?: string | null;
        residentId?: string | null;
        recipientType: string;
        email?: string | null;
        phone?: string | null;
      }
    >();

    // 1. Direct User IDs
    if (input.recipients.userIds && input.recipients.userIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: input.recipients.userIds }, status: 'ACTIVE' },
      });
      for (const u of users) {
        map.set(u.id, {
          id: u.id,
          userId: u.id,
          recipientType: 'USER',
          email: u.email,
          phone: u.phone,
        });
      }
    }

    // 2. Direct Resident IDs
    if (input.recipients.residentIds && input.recipients.residentIds.length > 0) {
      const residents = await this.prisma.resident.findMany({
        where: { id: { in: input.recipients.residentIds }, status: 'ACTIVE' },
      });
      for (const r of residents) {
        map.set(r.id, {
          id: r.id,
          userId: r.userId || null,
          residentId: r.id,
          recipientType: 'RESIDENT',
          email: r.email,
          phone: r.phone,
        });
      }
    }

    // 3. All Community Residents
    if (input.recipients.allCommunityResidents && input.communityId) {
      const residents = await this.prisma.resident.findMany({
        where: { communityId: input.communityId, status: 'ACTIVE' },
      });
      for (const r of residents) {
        map.set(r.id, {
          id: r.id,
          userId: r.userId || null,
          residentId: r.id,
          recipientType: 'RESIDENT',
          email: r.email,
          phone: r.phone,
        });
      }
    }

    return Array.from(map.values());
  }
}
