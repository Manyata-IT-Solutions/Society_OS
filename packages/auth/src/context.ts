import type { TenantContext, Actor } from '@community-os/types';
import type { PermissionCode } from './permissions.js';

export interface AuthenticatedUser extends Actor {
  permissions?: PermissionCode[];
}

export interface AuthContext extends TenantContext {
  user?: AuthenticatedUser;
  token?: {
    jti: string;
    exp: number;
    iat: number;
  };
}
