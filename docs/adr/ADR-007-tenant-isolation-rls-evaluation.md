# ADR-007: Tenant Isolation Strategy & PostgreSQL Row Level Security (RLS) Evaluation

## Status

Accepted

## Context

Community OS is a multi-tenant enterprise system managing hundreds of property management organizations and residential communities within a shared PostgreSQL database. We must guarantee strict tenant data isolation while considering operational complexity, connection pooling (PgBouncer), ORM compatibility (Prisma), background jobs, and developer ergonomics.

## Evaluated Alternatives

### Option 1: Full PostgreSQL Row-Level Security (RLS) from Day 1

- **Mechanism**: Enable `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on every table; set `SET LOCAL app.current_tenant = 'org-uuid'` on every SQL transaction.
- **Pros**: Native database-level isolation impossible to bypass from raw SQL.
- **Cons**:
  - Connection pooling (PgBouncer transaction mode) requires resetting or setting session variables on every query/transaction, creating performance and leakage overhead.
  - Complex for background workers and asynchronous jobs operating on multi-tenant batches.
  - High operational friction for database migrations and platform-level cross-tenant analytics.
  - Prisma ORM does not have native, transparent RLS session variable injection without raw SQL extensions.

### Option 2: Application-Level Tenant-Aware Repositories with Guardrails (Selected for Phase 1)

- **Mechanism**: Centralized `TenantScopedRepository` base class, where all read and write queries mandate a strongly typed `TenantContext` parameter. Compound database indexes and unique constraints guarantee scoped uniqueness.
- **Pros**: Clean TypeScript type safety, seamless Prisma integration, zero PgBouncer connection pooling friction, straightforward background worker execution.
- **Cons**: Requires developer discipline, enforced via base class abstractions, static analysis, and dedicated cross-tenant security test suites.

## Decision

We adopt **Option 2: Application-Level Tenant-Aware Repositories with Guardrails** as the primary isolation mechanism for Phase 1, supported by comprehensive automated security test suites.

We design the repository abstraction such that PostgreSQL RLS policies can be activated in a future phase without modifying domain business logic or controller signatures.

## Consequences

- **Positive**: High throughput, clean Prisma ergonomics, simple testing without custom PostgreSQL connection hooks.
- **Negative**: Developers must extend `TenantScopedRepository` and never write unscoped raw Prisma queries in domain modules.
- **Verification**: Dedicated `tenant-isolation.e2e-spec.ts` security test suite asserts isolation at CI.
