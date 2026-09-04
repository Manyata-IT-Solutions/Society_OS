import type { ScopedPermission, ScopeType } from '@community-os/types';

export interface TargetScope {
  scopeType: ScopeType;
  scopeId?: string | null;
  parentOrganizationId?: string | null;
}

/**
 * Centralized Scoped Authorization Policy Evaluator
 * Enforces SUBJECT + RESOURCE + ACTION + SCOPE with Deny-By-Default
 */
export function evaluateScopedPermission(
  actorPermissions: ScopedPermission[],
  requiredPermission: string,
  targetScope: TargetScope,
): boolean {
  if (!actorPermissions || actorPermissions.length === 0) {
    return false;
  }

  // Filter only assignments granting the exact required permission
  const matchingPermissions = actorPermissions.filter((p) => p.permission === requiredPermission);

  if (matchingPermissions.length === 0) {
    return false;
  }

  for (const p of matchingPermissions) {
    // 1. PLATFORM scope grants access globally
    if (p.scopeType === 'PLATFORM') {
      return true;
    }

    // 2. Target is ORGANIZATION scope
    if (targetScope.scopeType === 'ORGANIZATION') {
      if (p.scopeType === 'ORGANIZATION' && p.scopeId === targetScope.scopeId) {
        return true;
      }
    }

    // 3. Target is COMMUNITY scope
    if (targetScope.scopeType === 'COMMUNITY') {
      // A direct COMMUNITY scope assignment matching the community ID
      if (p.scopeType === 'COMMUNITY' && p.scopeId === targetScope.scopeId) {
        return true;
      }

      // An ORGANIZATION scope assignment matching the community's parent organization
      if (
        p.scopeType === 'ORGANIZATION' &&
        targetScope.parentOrganizationId &&
        p.scopeId === targetScope.parentOrganizationId
      ) {
        return true;
      }
    }

    // 4. Target is OWN scope (Self actions)
    if (targetScope.scopeType === 'OWN') {
      if (p.scopeType === 'OWN') {
        return true;
      }
    }
  }

  return false;
}
