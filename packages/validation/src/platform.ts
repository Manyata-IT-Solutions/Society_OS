import { z } from 'zod';

// ==========================================
// 1. AUDIT VALIDATION
// ==========================================

export const auditQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  actorType: z
    .enum(['USER', 'SYSTEM', 'SERVICE', 'BACKGROUND_JOB', 'PLATFORM_OPERATOR'])
    .optional(),
  action: z.string().max(100).optional(),
  resourceType: z.string().max(100).optional(),
  resourceId: z.string().max(100).optional(),
  result: z.enum(['SUCCESS', 'FAILURE', 'DENIED']).optional(),
  classification: z.enum(['INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional(),
  retentionCategory: z
    .enum(['SECURITY', 'FINANCIAL', 'GOVERNANCE', 'OPERATIONAL', 'SYSTEM'])
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/)
    .optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AuditQueryParams = z.infer<typeof auditQuerySchema>;

export const exportAuditSchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  action: z.string().max(100).optional(),
  resourceType: z.string().max(100).optional(),
});

export type ExportAuditInput = z.infer<typeof exportAuditSchema>;

// ==========================================
// 2. NOTIFICATION VALIDATION
// ==========================================

export const createNotificationTemplateSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  name: z.string().min(2).max(150),
  category: z
    .enum([
      'SYSTEM',
      'SECURITY',
      'ACCOUNT',
      'RESIDENT',
      'PROPERTY',
      'GOVERNANCE',
      'FINANCE',
      'MAINTENANCE',
    ])
    .default('SYSTEM'),
  channel: z.enum(['IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WHATSAPP', 'WEBHOOK']).default('IN_APP'),
  locale: z.string().min(2).max(10).default('en'),
  subjectTemplate: z.string().max(255).optional(),
  bodyTemplate: z.string().min(1).max(5000),
  variables: z.array(z.string().min(1).max(50)).default([]),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreateNotificationTemplateInput = z.infer<typeof createNotificationTemplateSchema>;

export const updateNotificationTemplateSchema = createNotificationTemplateSchema
  .partial()
  .omit({ code: true });

export type UpdateNotificationTemplateInput = z.infer<typeof updateNotificationTemplateSchema>;

export const sendNotificationSchema = z.object({
  communityId: z.string().uuid().optional(),
  templateCode: z.string().max(100).optional(),
  category: z
    .enum([
      'SYSTEM',
      'SECURITY',
      'ACCOUNT',
      'RESIDENT',
      'PROPERTY',
      'GOVERNANCE',
      'FINANCE',
      'MAINTENANCE',
    ])
    .default('SYSTEM'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']).default('NORMAL'),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(5000),
  targetUrl: z.string().max(500).optional(),
  channels: z
    .array(z.enum(['IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WHATSAPP', 'WEBHOOK']))
    .default(['IN_APP']),
  recipients: z.object({
    userIds: z.array(z.string().uuid()).optional(),
    residentIds: z.array(z.string().uuid()).optional(),
    roleCodes: z.array(z.string().max(50)).optional(),
    allCommunityResidents: z.boolean().optional(),
  }),
  variables: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  scheduledAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/)
    .optional(),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/)
    .optional(),
  deduplicationKey: z.string().max(150).optional(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

export const updateNotificationPreferenceSchema = z.object({
  category: z.enum([
    'SYSTEM',
    'SECURITY',
    'ACCOUNT',
    'RESIDENT',
    'PROPERTY',
    'GOVERNANCE',
    'FINANCE',
    'MAINTENANCE',
  ]),
  channel: z.enum(['IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WHATSAPP', 'WEBHOOK']),
  isEnabled: z.boolean(),
});

export type UpdateNotificationPreferenceInput = z.infer<typeof updateNotificationPreferenceSchema>;

export const notificationQuerySchema = z.object({
  category: z
    .enum([
      'SYSTEM',
      'SECURITY',
      'ACCOUNT',
      'RESIDENT',
      'PROPERTY',
      'GOVERNANCE',
      'FINANCE',
      'MAINTENANCE',
    ])
    .optional(),
  isRead: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type NotificationQueryParams = z.infer<typeof notificationQuerySchema>;

// ==========================================
// 3. DOCUMENT VALIDATION
// ==========================================

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z
    .enum([
      'POLICY',
      'LEGAL',
      'GOVERNANCE',
      'RESIDENT',
      'PROPERTY',
      'GENERAL',
      'FINANCIAL',
      'MAINTENANCE',
    ])
    .default('GENERAL'),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).default('INTERNAL'),
  retentionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  initialVersion: z.object({
    fileName: z.string().min(1).max(255),
    originalFileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    sizeBytes: z.coerce.bigint().positive(),
    checksum: z.string().length(64), // SHA-256
    storageKey: z.string().min(1).max(500),
  }),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  category: z
    .enum([
      'POLICY',
      'LEGAL',
      'GOVERNANCE',
      'RESIDENT',
      'PROPERTY',
      'GENERAL',
      'FINANCIAL',
      'MAINTENANCE',
    ])
    .optional(),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'QUARANTINED', 'DELETED']).optional(),
  retentionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  isLocked: z.boolean().optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export const createDocumentVersionSchema = z.object({
  fileName: z.string().min(1).max(255),
  originalFileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.coerce.bigint().positive(),
  checksum: z.string().length(64), // SHA-256
  storageKey: z.string().min(1).max(500),
});

export type CreateDocumentVersionInput = z.infer<typeof createDocumentVersionSchema>;

export const createDocumentLinkSchema = z.object({
  resourceType: z.string().min(1).max(100),
  resourceId: z.string().min(1).max(100),
  relationshipType: z
    .enum(['ATTACHMENT', 'PRIMARY_DOCUMENT', 'PROOF', 'CONTRACT', 'INVOICE_COPY', 'PHOTO_EVIDENCE'])
    .default('ATTACHMENT'),
});

export type CreateDocumentLinkInput = z.infer<typeof createDocumentLinkSchema>;

export const documentQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
  category: z
    .enum([
      'POLICY',
      'LEGAL',
      'GOVERNANCE',
      'RESIDENT',
      'PROPERTY',
      'GENERAL',
      'FINANCIAL',
      'MAINTENANCE',
    ])
    .optional(),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'QUARANTINED', 'DELETED']).optional(),
  search: z.string().max(100).optional(),
  resourceType: z.string().max(100).optional(),
  resourceId: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DocumentQueryParams = z.infer<typeof documentQuerySchema>;
