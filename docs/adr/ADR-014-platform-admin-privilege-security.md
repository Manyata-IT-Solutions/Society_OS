# ADR-014: Platform Administrator Privilege Escalation Defenses

## Status

Accepted

## Context

In a multi-tenant SaaS application, tenant administrators must not be able to elevate their privileges to access platform infrastructure, modify global settings, or inspect data belonging to other tenant organizations.

## Decision

1. Explicitly protect the `PLATFORM` scope level and the `PLATFORM_ADMIN` system role.
2. Enforce in `RoleAssignmentsService` and `PermissionGuard` that only actors with active Platform Administrator authority (`isPlatformAdmin: true`) can grant, assign, or revoke `PLATFORM` scope roles.
3. Lock system roles (`isSystem: true`) against modification or deletion by tenant admins.
4. Log all privilege assignment attempts to the structured audit log.

## Consequences

- **Positive**: Hardened multi-tenant isolation and complete immunity against lateral tenant privilege escalation.
- **Negative**: Platform admin operations must be performed using dedicated platform accounts.
