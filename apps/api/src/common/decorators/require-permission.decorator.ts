import { SetMetadata } from '@nestjs/common';
import type { ScopeType } from '@community-os/types';

export const REQUIRE_PERMISSION_KEY = 'REQUIRE_PERMISSION';

export interface RequirePermissionOptions {
  permission: string;
  scopeType?: ScopeType;
  scopeParam?: string; // e.g. 'organizationId' or 'communityId'
}

export const RequirePermission = (
  permission: string,
  options?: Omit<RequirePermissionOptions, 'permission'>,
) => SetMetadata(REQUIRE_PERMISSION_KEY, { permission, ...options });
