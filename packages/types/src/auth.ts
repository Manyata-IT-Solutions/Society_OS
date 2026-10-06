export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'ARCHIVED';

export type MembershipStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';

export type ScopeType = 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY' | 'OWN';

export type AssignmentStatus = 'ACTIVE' | 'REVOKED';

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  displayName: string;
  status: UserStatus;
  preferredLocale: string;
  timezone: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  lastActiveAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

export interface TenantMembership {
  id: string;
  userId: string;
  organizationId: string;
  communityId?: string | null;
  status: MembershipStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  scopeType: ScopeType;
  isSystem: boolean;
  organizationId?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description?: string | null;
  createdAt: Date;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  scopeType: ScopeType;
  scopeId?: string | null;
  status: AssignmentStatus;
  validFrom?: Date | null;
  validUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // in seconds
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  displayName: string;
  isPlatformAdmin?: boolean;
  sessionId: string;
  organizationId?: string;
  communityId?: string;
  iat?: number;
  exp?: number;
}

export interface Actor {
  id: string;
  userId?: string;
  email: string;
  displayName: string;
  isPlatformAdmin: boolean;
  sessionId: string;
}

export interface ScopedPermission {
  permission: string;
  scopeType: ScopeType;
  scopeId?: string | null;
}
