import type { EntityStatus } from '@community-os/types';

/**
 * Valid Status Transitions State Machine for Organization & Community Aggregates
 *
 * Rules:
 * - ACTIVE -> SUSPENDED (Allowed)
 * - ACTIVE -> ARCHIVED (Allowed)
 * - SUSPENDED -> ACTIVE (Allowed)
 * - SUSPENDED -> ARCHIVED (Allowed)
 * - ARCHIVED is terminal (Cannot transition back without formal platform restore workflow)
 * - Self-transition is a no-op / allowed
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<EntityStatus, ReadonlySet<EntityStatus>> = {
  ACTIVE: new Set<EntityStatus>(['ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  SUSPENDED: new Set<EntityStatus>(['SUSPENDED', 'ACTIVE', 'ARCHIVED']),
  ARCHIVED: new Set<EntityStatus>(['ARCHIVED']),
};

export function isValidStatusTransition(
  currentStatus: EntityStatus,
  targetStatus: EntityStatus,
): boolean {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.has(targetStatus) : false;
}
