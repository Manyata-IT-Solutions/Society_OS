export interface PushMessage {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'normal' | 'high';
}

export interface PushDeliveryResult {
  success: boolean;
  providerReference?: string;
  error?: string;
}

export interface PushProvider {
  sendPush(message: PushMessage): Promise<PushDeliveryResult>;
}
