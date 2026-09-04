import type { ScopeType } from './auth.js';

// ==========================================
// 1. AUDIT TYPES
// ==========================================

export type AuditActorType = 'USER' | 'SYSTEM' | 'SERVICE' | 'BACKGROUND_JOB' | 'PLATFORM_OPERATOR';

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'DENIED';

export type AuditClassification = 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export type AuditRetentionCategory =
  'SECURITY' | 'FINANCIAL' | 'GOVERNANCE' | 'OPERATIONAL' | 'SYSTEM';

export interface AuditRecord {
  id: string;
  organizationId?: string | null;
  communityId?: string | null;
  actorType: AuditActorType;
  actorId?: string | null;
  sessionId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  resourceScope: ScopeType;
  result: AuditResult;
  requestId?: string | null;
  correlationId?: string | null;
  occurredAt: Date;
  source: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
  metadata: Record<string, unknown>;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  changes?: Record<string, { before: unknown; after: unknown }> | null;
  classification: AuditClassification;
  retentionCategory: AuditRetentionCategory;
}

export interface AuditQueryFilters {
  organizationId?: string;
  communityId?: string;
  actorId?: string;
  actorType?: AuditActorType;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  result?: AuditResult;
  classification?: AuditClassification;
  retentionCategory?: AuditRetentionCategory;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

// ==========================================
// 2. NOTIFICATION TYPES
// ==========================================

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS' | 'WHATSAPP' | 'WEBHOOK';

export type NotificationCategory =
  | 'SYSTEM'
  | 'SECURITY'
  | 'ACCOUNT'
  | 'RESIDENT'
  | 'PROPERTY'
  | 'GOVERNANCE'
  | 'FINANCE'
  | 'MAINTENANCE';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';

export type NotificationStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type NotificationDeliveryStatus =
  'QUEUED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED' | 'SKIPPED';

export interface NotificationTemplate {
  id: string;
  organizationId?: string | null;
  communityId?: string | null;
  code: string;
  name: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  locale: string;
  subjectTemplate?: string | null;
  bodyTemplate: string;
  variables: string[];
  isSystem: boolean;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  organizationId?: string | null;
  communityId?: string | null;
  templateId?: string | null;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  targetUrl?: string | null;
  metadata: Record<string, unknown>;
  status: NotificationStatus;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  expiresAt?: Date | null;
  deduplicationKey?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  userId?: string | null;
  residentId?: string | null;
  recipientType: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

export interface NotificationDelivery {
  id: string;
  recipientId: string;
  channel: NotificationChannel;
  destination?: string | null;
  status: NotificationDeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt?: Date | null;
  lastAttemptAt?: Date | null;
  providerReference?: string | null;
  providerError?: string | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  idempotencyKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 3. DOCUMENT TYPES
// ==========================================

export type DocumentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'QUARANTINED' | 'DELETED';

export type DocumentClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export type DocumentCategory =
  | 'POLICY'
  | 'LEGAL'
  | 'GOVERNANCE'
  | 'RESIDENT'
  | 'PROPERTY'
  | 'GENERAL'
  | 'FINANCIAL'
  | 'MAINTENANCE';

export type DocumentVersionStatus = 'PENDING_SCAN' | 'ACTIVE' | 'QUARANTINED' | 'ARCHIVED';

export type DocumentRelationshipType =
  'ATTACHMENT' | 'PRIMARY_DOCUMENT' | 'PROOF' | 'CONTRACT' | 'INVOICE_COPY' | 'PHOTO_EVIDENCE';

export interface Document {
  id: string;
  organizationId: string;
  communityId?: string | null;
  title: string;
  description?: string | null;
  category: DocumentCategory;
  classification: DocumentClassification;
  status: DocumentStatus;
  currentVersionId?: string | null;
  isLocked: boolean;
  retentionDate?: Date | null;
  createdById?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storageKey: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: bigint;
  checksum: string;
  status: DocumentVersionStatus;
  uploadedById?: string | null;
  uploadedAt: Date;
}

export interface DocumentLink {
  id: string;
  organizationId: string;
  communityId?: string | null;
  documentId: string;
  resourceType: string;
  resourceId: string;
  relationshipType: DocumentRelationshipType;
  createdById?: string | null;
  createdAt: Date;
}

// ==========================================
// 4. STORAGE PROVIDER INTERFACES
// ==========================================

export interface StorageMetadata {
  key: string;
  sizeBytes: number;
  mimeType: string;
  checksum: string;
  lastModified: Date;
}

export interface StorageUploadResult {
  storageKey: string;
  sizeBytes: bigint;
  checksum: string;
  mimeType: string;
  fileName: string;
}

export interface ObjectStorageProvider {
  putObject(
    storageKey: string,
    content: Uint8Array | ArrayBuffer | string,
    mimeType: string,
  ): Promise<StorageUploadResult>;
  getObject(storageKey: string): Promise<{ stream: unknown; metadata: StorageMetadata }>;
  getPresignedUploadUrl(
    storageKey: string,
    mimeType: string,
    expiresInSeconds?: number,
  ): Promise<{ url: string; storageKey: string; headers: Record<string, string> }>;
  getPresignedDownloadUrl(
    storageKey: string,
    expiresInSeconds?: number,
    downloadFilename?: string,
  ): Promise<string>;
  deleteObject(storageKey: string): Promise<void>;
  headObject(storageKey: string): Promise<StorageMetadata | null>;
}
