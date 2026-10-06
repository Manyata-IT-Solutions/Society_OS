export type OrganizationId = string;
export type CommunityId = string;
export type UserId = string;
export type CorrelationId = string;
export type RequestId = string;

/**
 * Tenant Context Interface
 * Represents the resolved multi-tenant scope of an incoming request.
 */
export interface TenantContext {
  organizationId?: OrganizationId;
  communityId?: CommunityId;
  userId?: UserId;
  roles?: string[];
  permissions?: string[];
  isPlatformAdmin?: boolean;
  correlationId: CorrelationId;
  requestId: RequestId;
}

/**
 * Audit context captured automatically during data operations
 */
export interface AuditContext {
  userId?: UserId;
  organizationId?: OrganizationId;
  communityId?: CommunityId;
  ipAddress?: string;
  userAgent?: string;
  requestId: RequestId;
}
