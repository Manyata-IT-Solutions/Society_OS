import type {
  AuditRecord,
  Notification,
  NotificationTemplate,
  NotificationDelivery,
  NotificationPreference,
  Document,
  DocumentVersion,
  DocumentLink,
} from '@community-os/types';

// ==========================================
// 1. AUDIT DTOs & MAPPERS
// ==========================================

export interface AuditRecordSummaryDto {
  id: string;
  organizationId: string | null;
  communityId: string | null;
  actorType: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceScope: string;
  result: string;
  occurredAt: string;
  source: string;
  classification: string;
  retentionCategory: string;
}

export interface AuditRecordDetailDto extends AuditRecordSummaryDto {
  sessionId: string | null;
  requestId: string | null;
  correlationId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  changes: Record<string, { before: unknown; after: unknown }> | null;
}

export function toAuditRecordSummaryDto(record: AuditRecord): AuditRecordSummaryDto {
  return {
    id: record.id,
    organizationId: record.organizationId || null,
    communityId: record.communityId || null,
    actorType: record.actorType,
    actorId: record.actorId || null,
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId || null,
    resourceScope: record.resourceScope,
    result: record.result,
    occurredAt:
      record.occurredAt instanceof Date
        ? record.occurredAt.toISOString()
        : String(record.occurredAt),
    source: record.source,
    classification: record.classification,
    retentionCategory: record.retentionCategory,
  };
}

export function toAuditRecordDetailDto(
  record: AuditRecord,
  includeSensitiveDetails = false,
): AuditRecordDetailDto {
  const base = toAuditRecordSummaryDto(record);
  return {
    ...base,
    sessionId: record.sessionId || null,
    requestId: record.requestId || null,
    correlationId: record.correlationId || null,
    ipAddress: record.ipAddress || null,
    userAgent: record.userAgent || null,
    reason: record.reason || null,
    metadata: record.metadata || {},
    beforeSnapshot: includeSensitiveDetails ? record.beforeSnapshot || null : null,
    afterSnapshot: includeSensitiveDetails ? record.afterSnapshot || null : null,
    changes: record.changes || null,
  };
}

// ==========================================
// 2. NOTIFICATION DTOs & MAPPERS
// ==========================

export interface NotificationResponseDto {
  id: string;
  organizationId: string | null;
  communityId: string | null;
  templateId: string | null;
  type: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  targetUrl: string | null;
  metadata: Record<string, unknown>;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  isRead?: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplateResponseDto {
  id: string;
  organizationId: string | null;
  communityId: string | null;
  code: string;
  name: string;
  category: string;
  channel: string;
  locale: string;
  subjectTemplate: string | null;
  bodyTemplate: string;
  variables: string[];
  isSystem: boolean;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDeliveryResponseDto {
  id: string;
  recipientId: string;
  channel: string;
  destination: string | null;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  lastAttemptAt: string | null;
  providerReference: string | null;
  providerError: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  idempotencyKey: string | null;
  createdAt: string;
}

export interface NotificationPreferenceResponseDto {
  id: string;
  userId: string;
  category: string;
  channel: string;
  isEnabled: boolean;
}

export function toNotificationResponseDto(
  notification: Notification,
  isRead?: boolean,
  readAt?: Date | null,
): NotificationResponseDto {
  return {
    id: notification.id,
    organizationId: notification.organizationId || null,
    communityId: notification.communityId || null,
    templateId: notification.templateId || null,
    type: notification.type,
    category: notification.category,
    priority: notification.priority,
    title: notification.title,
    body: notification.body,
    targetUrl: notification.targetUrl || null,
    metadata: notification.metadata || {},
    status: notification.status,
    scheduledAt: notification.scheduledAt ? notification.scheduledAt.toISOString() : null,
    sentAt: notification.sentAt ? notification.sentAt.toISOString() : null,
    expiresAt: notification.expiresAt ? notification.expiresAt.toISOString() : null,
    isRead: isRead !== undefined ? isRead : undefined,
    readAt: readAt ? readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  };
}

export function toNotificationTemplateResponseDto(
  template: NotificationTemplate,
): NotificationTemplateResponseDto {
  return {
    id: template.id,
    organizationId: template.organizationId || null,
    communityId: template.communityId || null,
    code: template.code,
    name: template.name,
    category: template.category,
    channel: template.channel,
    locale: template.locale,
    subjectTemplate: template.subjectTemplate || null,
    bodyTemplate: template.bodyTemplate,
    variables: Array.isArray(template.variables) ? (template.variables as string[]) : [],
    isSystem: template.isSystem,
    isActive: template.isActive,
    version: template.version,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function toNotificationDeliveryResponseDto(
  delivery: NotificationDelivery,
): NotificationDeliveryResponseDto {
  return {
    id: delivery.id,
    recipientId: delivery.recipientId,
    channel: delivery.channel,
    destination: delivery.destination || null,
    status: delivery.status,
    attemptCount: delivery.attemptCount,
    maxAttempts: delivery.maxAttempts,
    nextAttemptAt: delivery.nextAttemptAt ? delivery.nextAttemptAt.toISOString() : null,
    lastAttemptAt: delivery.lastAttemptAt ? delivery.lastAttemptAt.toISOString() : null,
    providerReference: delivery.providerReference || null,
    providerError: delivery.providerError || null,
    sentAt: delivery.sentAt ? delivery.sentAt.toISOString() : null,
    deliveredAt: delivery.deliveredAt ? delivery.deliveredAt.toISOString() : null,
    idempotencyKey: delivery.idempotencyKey || null,
    createdAt: delivery.createdAt.toISOString(),
  };
}

export function toNotificationPreferenceResponseDto(
  pref: NotificationPreference,
): NotificationPreferenceResponseDto {
  return {
    id: pref.id,
    userId: pref.userId,
    category: pref.category,
    channel: pref.channel,
    isEnabled: pref.isEnabled,
  };
}

// ==========================================
// 3. DOCUMENT DTOs & MAPPERS
// ==========================================

export interface DocumentSummaryDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  title: string;
  description: string | null;
  category: string;
  classification: string;
  status: string;
  currentVersionId: string | null;
  isLocked: boolean;
  retentionDate: string | null;
  createdById: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  currentVersion?: DocumentVersionResponseDto | null;
}

export interface DocumentVersionResponseDto {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: string;
  checksum: string;
  status: string;
  uploadedById: string | null;
  uploadedAt: string;
}

export interface DocumentLinkResponseDto {
  id: string;
  organizationId: string;
  communityId: string | null;
  documentId: string;
  resourceType: string;
  resourceId: string;
  relationshipType: string;
  createdById: string | null;
  createdAt: string;
  document?: DocumentSummaryDto;
}

export function toDocumentVersionResponseDto(version: DocumentVersion): DocumentVersionResponseDto {
  return {
    id: version.id,
    documentId: version.documentId,
    versionNumber: version.versionNumber,
    fileName: version.fileName,
    originalFileName: version.originalFileName,
    mimeType: version.mimeType,
    sizeBytes: version.sizeBytes.toString(),
    checksum: version.checksum,
    status: version.status,
    uploadedById: version.uploadedById || null,
    uploadedAt: version.uploadedAt.toISOString(),
  };
}

export function toDocumentSummaryDto(
  doc: Document,
  currentVersion?: DocumentVersion | null,
): DocumentSummaryDto {
  return {
    id: doc.id,
    organizationId: doc.organizationId,
    communityId: doc.communityId || null,
    title: doc.title,
    description: doc.description || null,
    category: doc.category,
    classification: doc.classification,
    status: doc.status,
    currentVersionId: doc.currentVersionId || null,
    isLocked: doc.isLocked,
    retentionDate: doc.retentionDate
      ? doc.retentionDate instanceof Date
        ? doc.retentionDate.toISOString().split('T')[0] || null
        : String(doc.retentionDate)
      : null,
    createdById: doc.createdById || null,
    version: doc.version,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    currentVersion: currentVersion ? toDocumentVersionResponseDto(currentVersion) : null,
  };
}

export function toDocumentLinkResponseDto(
  link: DocumentLink,
  document?: Document,
): DocumentLinkResponseDto {
  return {
    id: link.id,
    organizationId: link.organizationId,
    communityId: link.communityId || null,
    documentId: link.documentId,
    resourceType: link.resourceType,
    resourceId: link.resourceId,
    relationshipType: link.relationshipType,
    createdById: link.createdById || null,
    createdAt: link.createdAt.toISOString(),
    document: document ? toDocumentSummaryDto(document) : undefined,
  };
}
