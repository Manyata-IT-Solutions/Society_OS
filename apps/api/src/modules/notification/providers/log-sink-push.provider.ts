import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service.js';
import type { PushProvider, PushMessage, PushDeliveryResult } from './push-provider.interface.js';
import crypto from 'crypto';

@Injectable()
export class LogSinkPushProvider implements PushProvider {
  constructor(private readonly logger: LoggerService) {}

  async sendPush(message: PushMessage): Promise<PushDeliveryResult> {
    const reference = `dev-push-${crypto.randomUUID()}`;
    this.logger.log(
      `[DEV PUSH SINK] User: ${message.recipientUserId} | Title: "${message.title}" | Ref: ${reference}`,
      'LogSinkPushProvider',
    );
    return {
      success: true,
      providerReference: reference,
    };
  }
}
