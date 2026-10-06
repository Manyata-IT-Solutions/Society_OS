import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service.js';
import type {
  EmailProvider,
  EmailMessage,
  EmailDeliveryResult,
} from './email-provider.interface.js';
import crypto from 'crypto';

@Injectable()
export class LogSinkEmailProvider implements EmailProvider {
  constructor(private readonly logger: LoggerService) {}

  async sendEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
    const reference = `dev-email-${crypto.randomUUID()}`;
    this.logger.log(
      `[DEV EMAIL SINK] To: ${message.to} | Subject: "${message.subject}" | Ref: ${reference}`,
      'LogSinkEmailProvider',
    );
    return {
      success: true,
      providerReference: reference,
    };
  }
}
