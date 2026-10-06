# ADR-0026: Hierarchical Scoped Tenant Isolation & Enforcement

## Status
Accepted

## Context
Community OS serves multiple organizations, property portfolios, communities, and residents. Relying on frontend-supplied tenant headers introduces severe BOLA/IDOR risks.

## Decision
1. All repository query paths must enforce tenant scoping derived from server-verified subject memberships.
2. Tenant IDs in headers (`x-organization-id`, `x-community-id`) serve only as requested context selectors; `AuthorizationService` strictly enforces access before executing any domain action.
3. Cross-tenant access attempts return safe 404 (or 403) without leaking metadata.

## Consequences
Guarantees absolute tenant isolation across all 25 modules.
