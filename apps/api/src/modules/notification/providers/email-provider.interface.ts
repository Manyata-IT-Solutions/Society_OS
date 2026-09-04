export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailDeliveryResult {
  success: boolean;
  providerReference?: string;
  error?: string;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<EmailDeliveryResult>;
}
