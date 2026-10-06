# ADR-027: Resident Account Linking & Invitation Security

## Status

Accepted

## Context

When inviting an unlinked resident to use the mobile or web app, credentials and access roles must be granted securely under the least-privilege principle.

## Decision

Inviting a resident provisions a `User` account with status `PENDING`, creates a `TenantMembership` in the resident's community, assigns the system role `RESIDENT` with `COMMUNITY` scope, and links `Resident.userId` to `User.id`. The `RESIDENT` role only grants permissions to self-scoped data (`resident.self.view`, `household.self.view`, `unit.self.view`).

## Consequences

- **Positive**: Seamless self-service onboarding for residents.
- **Positive**: Residents cannot view data belonging to other units or households.
- **Trade-off**: Requires linking validation to ensure a User is not linked to conflicting profiles in the same community.
