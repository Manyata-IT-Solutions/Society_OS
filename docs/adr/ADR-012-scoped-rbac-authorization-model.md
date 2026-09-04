# ADR-012: Scoped RBAC Authorization Model

## Status

Accepted

## Context

Community OS serves multiple tenant tiers (Platform, Organization, Community). A traditional `user.role` column is inadequate because a user may hold different responsibilities in different tenant scopes.

## Decision

Model authorization strictly as `SUBJECT + RESOURCE + ACTION + SCOPE`:

1. Roles are bundles of atomic permissions (`resource.action`).
2. Role Assignments explicitly bind a user to a role with a `scopeType` (`PLATFORM`, `ORGANIZATION`, `COMMUNITY`, `OWN`) and an optional `scopeId`.
3. Downward scope inheritance allows Organization admins to manage child communities without duplicating community-level role assignments.
4. Fail-closed deny-by-default policy is enforced globally.

## Consequences

- **Positive**: Extremely flexible, scalable, and audit-compliant authorization model.
- **Negative**: Requires scope resolution logic in authorization guards.
