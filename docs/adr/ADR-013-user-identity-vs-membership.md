# ADR-013: Separation of User Identity and Tenant Membership

## Status

Accepted

## Context

In residential real-estate and facility management, users (e.g. residents, property managers, maintenance vendors) frequently participate in multiple societies or work across multiple property management organizations.

## Decision

1. Decouple User Identity (`User`) from Tenant Associations (`TenantMembership`).
2. A single `User` identity holds credentials, phone, email, timezone, and language preferences.
3. `TenantMembership` records associate the user with specific `Organization` and `Community` instances, managing their membership status (`INVITED`, `ACTIVE`, `SUSPENDED`, `REVOKED`, `EXPIRED`).

## Consequences

- **Positive**: Single sign-on across societies, unified resident/vendor profiles, no duplicate accounts.
- **Negative**: Querying users within a tenant requires joining membership records.
