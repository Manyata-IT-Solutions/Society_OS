import type {
  User,
  UserSession,
  TenantMembership,
  Role,
  RoleAssignment,
  UserStatus,
  MembershipStatus,
  ScopeType,
  AssignmentStatus,
} from '@community-os/types';

export interface LoginRequestDto {
  email: string;
  password?: string;
}

export interface LoginResponseDto {
  user: UserResponseDto;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
  };
  sessionId: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface UserResponseDto {
  id: string;
  email: string;
  phone: string | null;
  displayName: string;
  status: UserStatus;
  preferredLocale: string;
  timezone: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  phone?: string | null;
  displayName: string;
  password?: string;
  preferredLocale?: string;
  timezone?: string;
}

export interface UpdateUserDto {
  displayName?: string;
  phone?: string | null;
  preferredLocale?: string;
  timezone?: string;
  expectedVersion?: number;
}

export interface ChangeUserStatusDto {
  status: UserStatus;
  expectedVersion?: number;
}

export interface MembershipResponseDto {
  id: string;
  userId: string;
  organizationId: string;
  communityId: string | null;
  status: MembershipStatus;
  user?: UserResponseDto;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipDto {
  userId: string;
  organizationId: string;
  communityId?: string | null;
  status?: MembershipStatus;
}

export interface ChangeMembershipStatusDto {
  status: MembershipStatus;
  expectedVersion?: number;
}

export interface PermissionResponseDto {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface RoleResponseDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  scopeType: ScopeType;
  isSystem: boolean;
  organizationId: string | null;
  permissions: PermissionResponseDto[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  code: string;
  description?: string | null;
  scopeType: ScopeType;
  organizationId?: string | null;
  permissionCodes: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string | null;
  permissionCodes?: string[];
  expectedVersion?: number;
}

export interface RoleAssignmentResponseDto {
  id: string;
  userId: string;
  roleId: string;
  role?: RoleResponseDto;
  scopeType: ScopeType;
  scopeId: string | null;
  status: AssignmentStatus;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleAssignmentDto {
  userId: string;
  roleId: string;
  scopeType: ScopeType;
  scopeId?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface SessionResponseDto {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent?: boolean;
  createdAt: string;
}

export function toUserResponseDto(u: User | Record<string, unknown>): UserResponseDto {
  const raw = u as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    email: raw['email'] as string,
    phone: (raw['phone'] as string) ?? null,
    displayName: (raw['displayName'] as string) || (raw['display_name'] as string) || '',
    status: raw['status'] as UserStatus,
    preferredLocale:
      (raw['preferredLocale'] as string) || (raw['preferred_locale'] as string) || 'en-US',
    timezone: (raw['timezone'] as string) || 'UTC',
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
  };
}

export function toMembershipResponseDto(
  m: TenantMembership | Record<string, unknown>,
): MembershipResponseDto {
  const raw = m as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    userId: (raw['userId'] as string) || (raw['user_id'] as string),
    organizationId: (raw['organizationId'] as string) || (raw['organization_id'] as string),
    communityId: (raw['communityId'] as string) || (raw['community_id'] as string) || null,
    status: raw['status'] as MembershipStatus,
    user: raw['user'] ? toUserResponseDto(raw['user'] as Record<string, unknown>) : undefined,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
  };
}

export function toRoleResponseDto(r: Role | Record<string, unknown>): RoleResponseDto {
  const raw = r as Record<string, unknown>;
  const perms = Array.isArray(raw['permissions'])
    ? (raw['permissions'] as Array<Record<string, unknown>>).map((p) => {
        const perm = (p['permission'] as Record<string, unknown>) || p;
        return {
          id: perm['id'] as string,
          code: perm['code'] as string,
          resource: perm['resource'] as string,
          action: perm['action'] as string,
          description: (perm['description'] as string) ?? null,
        };
      })
    : [];

  return {
    id: raw['id'] as string,
    name: raw['name'] as string,
    code: raw['code'] as string,
    description: (raw['description'] as string) ?? null,
    scopeType: (raw['scopeType'] as ScopeType) || (raw['scope_type'] as ScopeType),
    isSystem: Boolean(raw['isSystem'] !== undefined ? raw['isSystem'] : raw['is_system']),
    organizationId: (raw['organizationId'] as string) || (raw['organization_id'] as string) || null,
    permissions: perms,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
  };
}

export function toRoleAssignmentResponseDto(
  a: RoleAssignment | Record<string, unknown>,
): RoleAssignmentResponseDto {
  const raw = a as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    userId: (raw['userId'] as string) || (raw['user_id'] as string),
    roleId: (raw['roleId'] as string) || (raw['role_id'] as string),
    role: raw['role'] ? toRoleResponseDto(raw['role'] as Record<string, unknown>) : undefined,
    scopeType: (raw['scopeType'] as ScopeType) || (raw['scope_type'] as ScopeType),
    scopeId: (raw['scopeId'] as string) || (raw['scope_id'] as string) || null,
    status: raw['status'] as AssignmentStatus,
    validFrom: raw['validFrom']
      ? raw['validFrom'] instanceof Date
        ? raw['validFrom'].toISOString()
        : String(raw['validFrom'])
      : null,
    validUntil: raw['validUntil']
      ? raw['validUntil'] instanceof Date
        ? raw['validUntil'].toISOString()
        : String(raw['validUntil'])
      : null,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
  };
}

export function toSessionResponseDto(
  s: UserSession | Record<string, unknown>,
  currentSessionId?: string,
): SessionResponseDto {
  const raw = s as Record<string, unknown>;
  const id = raw['id'] as string;
  return {
    id,
    userId: (raw['userId'] as string) || (raw['user_id'] as string),
    userAgent: (raw['userAgent'] as string) || (raw['user_agent'] as string) || null,
    ipAddress: (raw['ipAddress'] as string) || (raw['ip_address'] as string) || null,
    lastActiveAt:
      raw['lastActiveAt'] instanceof Date
        ? raw['lastActiveAt'].toISOString()
        : String(raw['lastActiveAt']),
    expiresAt:
      raw['expiresAt'] instanceof Date ? raw['expiresAt'].toISOString() : String(raw['expiresAt']),
    isCurrent: currentSessionId ? id === currentSessionId : false,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
  };
}
