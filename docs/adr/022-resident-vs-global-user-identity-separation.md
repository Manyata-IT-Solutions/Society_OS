# ADR-022: Resident vs Global User Identity Separation

## Status

Accepted

## Context

In residential ERP platforms, conflating real-world persons (`Resident`) with login accounts (`User`) causes severe onboarding friction. Minors, non-app residents, and off-site landlords must exist in the community database without requiring immediate credential generation.

## Decision

We decouple `User` (platform-wide authentication identity) from `Resident` (community-scoped residential profile). A `Resident` record can exist independently with `userId = null`. When the resident is invited or provisions credentials, `Resident.userId` is linked to `User.id` and assigned the scoped `RESIDENT` role.

## Consequences

- **Positive**: Property managers can onboard entire residential towers before inviting individual residents.
- **Positive**: Minors and dependent family members are accurately tracked without requiring email accounts.
- **Trade-off**: Requires linking workflows and duplicate detection across resident profiles and user accounts.
