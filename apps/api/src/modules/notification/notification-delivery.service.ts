import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository.js';
import { LoggerService } from '../logger/logger.service.js';
import { LogSinkEmailProvider } from './providers/log-sink-email.provider.js';
import { LogSinkSmsProvider } from './providers/log-sink-sms.provider.js';
import { LogSinkPushProvider } from './providers/log-sink-push.provider.js';
import type { NotificationDelivery } from '@community-os/types';

@Injectable()
export class NotificationDeliveryService {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly emailProvider: LogSinkEmailProvider,
    private readonly smsProvider: LogSinkSmsProvider,
    private readonly pushProvider: LogSinkPushProvider,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Process a single delivery attempt for any supported channel.
   */
  async processDelivery(
    delivery: NotificationDelivery,
    title: string,
    body: string,
  ): Promise<void> {
    const nextAttemptCount = delivery.attemptCount + 1;

    try {
      if (delivery.channel === 'IN_APP') {
        // In-App notifications are delivered by virtue of database presence
        await this.notificationRepo.updateDeliveryStatus(delivery.id, {
          status: 'DELIVERED',
          attemptCount: nextAttemptCount,
          deliveredAt: new Date(),
        });
        return;
      }

      if (delivery.channel === 'EMAIL') {
        if (!delivery.destination) {
          await this.notificationRepo.updateDeliveryStatus(delivery.id, {
            status: 'SKIPPED',
            attemptCount: nextAttemptCount,
            providerError: 'No recipient email destination specified.',
          });
          return;
        }

        const result = await this.emailProvider.sendEmail({
          to: delivery.destination,
          subject: title,
          body,
        });

        if (result.success) {
          await this.notificationRepo.updateDeliveryStatus(delivery.id, {
            status: 'SENT',
            attemptCount: nextAttemptCount,
            providerReference: result.providerReference,
            sentAt: new Date(),
          });
        } else {
          await this.handleDeliveryFailure(
            delivery,
            nextAttemptCount,
            result.error || 'Email dispatch failed',
          );
        }
        return;
      }

      if (delivery.channel === 'SMS') {
        if (!delivery.destination) {
          await this.notificationRepo.updateDeliveryStatus(delivery.id, {
            status: 'SKIPPED',
            attemptCount: nextAttemptCount,
            providerError: 'No recipient phone number destination specified.',
          });
          return;
        }

        const result = await this.smsProvider.sendSms({
          phoneNumber: delivery.destination,
          message: `${title}: ${body}`,
        });

        if (result.success) {
          await this.notificationRepo.updateDeliveryStatus(delivery.id, {
            status: 'SENT',
            attemptCount: nextAttemptCount,
            providerReference: result.providerReference,
            sentAt: new Date(),
          });
        } else {
          await this.handleDeliveryFailure(
            delivery,
            nextAttemptCount,
            result.error || 'SMS dispatch failed',
          );
        }
        return;
      }

      if (delivery.channel === 'PUSH') {
        const result = await this.pushProvider.sendPush({
          recipientUserId: delivery.recipientId,
          title,
          body,
        });

        if (result.success) {
          await this.notificationRepo.updateDeliveryStatus(delivery.id, {
            status: 'SENT',
            attemptCount: nextAttemptCount,
            providerReference: result.providerReference,
            sentAt: new Date(),
          });
        } else {
          await this.handleDeliveryFailure(
            delivery,
            nextAttemptCount,
            result.error || 'Push dispatch failed',
          );
        }
        return;
      }

      // Channels not yet implemented (WhatsApp, Webhook)
      await this.notificationRepo.updateDeliveryStatus(delivery.id, {
        status: 'SKIPPED',
        attemptCount: nextAttemptCount,
        providerError: `Channel ${delivery.channel} provider not yet configured.`,
      });
    } catch (err) {
      await this.handleDeliveryFailure(delivery, nextAttemptCount, (err as Error).message);
    }
  }

  private async handleDeliveryFailure(
    delivery: NotificationDelivery,
    attemptCount: number,
    errorMessage: string,
  ): Promise<void> {
    const isPermanent = attemptCount >= delivery.maxAttempts;

    // Exponential backoff: 2^(attemptCount) * 30 seconds
    const backoffSeconds = Math.pow(2, attemptCount) * 30;
    const nextAttemptAt = isPermanent ? null : new Date(Date.now() + backoffSeconds * 1000);

    this.logger.warn(
      `Delivery failed for delivery ${delivery.id} (attempt ${attemptCount}/${delivery.maxAttempts}): ${errorMessage}`,
      'NotificationDeliveryService',
    );

    await this.notificationRepo.updateDeliveryStatus(delivery.id, {
      status: 'FAILED',
      attemptCount,
      nextAttemptAt,
      providerError: errorMessage,
      lastAttemptAt: new Date(),
    });
  }
}
