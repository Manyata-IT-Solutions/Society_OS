import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service.js';
import type { SmsProvider, SmsMessage, SmsDeliveryResult } from './sms-provider.interface.js';
import crypto from 'crypto';

@Injectable()
export class LogSinkSmsProvider implements SmsProvider {
  constructor(private readonly logger: LoggerService) {}

  async sendSms(message: SmsMessage): Promise<SmsDeliveryResult> {
    const reference = `dev-sms-${crypto.randomUUID()}`;
    this.logger.log(
      `[DEV SMS SINK] To: ${message.phoneNumber} | Text: "${message.message.slice(0, 50)}..." | Ref: ${reference}`,
      'LogSinkSmsProvider',
    );
    return {
      success: true,
      providerReference: reference,
    };
  }
}
