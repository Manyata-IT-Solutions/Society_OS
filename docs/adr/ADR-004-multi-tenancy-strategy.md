# ADR-004: Multi-Tenancy Strategy & Data Isolation Architecture

## Status

Accepted

## Context

Community OS must serve thousands of communities, from small 20-unit housing societies to 10,000-unit smart townships and nationwide property management enterprise portfolios. We must establish a multi-tenancy model that balances data security, maintenance scalability, and infrastructure cost.

## Decision

We adopt a **Shared Database with Logical Tenant Isolation (Discriminator-Based)** model, complemented by:

1. Mandatory `organization_id` and `community_id` columns on tenant-scoped tables.
2. Server-side context propagation via `TenantContextMiddleware` and `AsyncLocalStorage`.
3. Repository-level automated query filtering (`ITenantScopedRepository`).
4. Compound unique constraints combining business keys with tenant discriminators.
5. Extensible connection resolver interface for future dedicated enterprise databases.

## Alternatives Considered

- **Database-per-Tenant (10,000 PostgreSQL Databases)**: Rejected. Unmanageable operational overhead, severe connection pool exhaustion, and prohibitive cloud costs for small/medium societies.
- **Schema-per-Tenant (PostgreSQL Schemas)**: Rejected. Running thousands of simultaneous schema migrations causes database lock storms and migration tooling degradation.

## Consequences

- **Positive**: High infrastructure utilization, instant onboarding of new communities, simple cross-society analytics for property management enterprises.
- **Negative**: Requires strict discipline and automated CI tests to guarantee that no query omits the tenant filter.
