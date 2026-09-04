export interface SmsMessage {
  phoneNumber: string;
  message: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
}

export interface SmsDeliveryResult {
  success: boolean;
  providerReference?: string;
  error?: string;
}

export interface SmsProvider {
  sendSms(message: SmsMessage): Promise<SmsDeliveryResult>;
}
