# ADR-003: PostgreSQL as Primary Transactional System of Record

## Status

Accepted

## Context

Community OS manages critical financial ledgers, maintenance billing, resident directories, legal voting records, and property asset lifecycles. We require a storage engine with:

1. Rock-solid ACID compliance and transactional guarantees.
2. Advanced indexing, JSONB support for dynamic configuration schemas, and spatial/text search capabilities.
3. Proven ecosystem maturity and predictable operational costs.

## Decision

We select **PostgreSQL 16** as the authoritative primary database, paired with **Prisma ORM** for schema migrations and type safety.

- PostgreSQL provides battle-tested reliability, native JSONB support for our "Configure, Do Not Customize" dynamic engine, and robust row-level security capabilities.
- Prisma ORM generates static TypeScript definitions from declarative schemas while abstracting database migration lifecycles.

## Alternatives Considered

- **MongoDB / NoSQL Document Stores**: Rejected. Residential ERP relies heavily on relational integrity, foreign key consistency, and financial accounting transactions.
- **MySQL / MariaDB**: Rejected. PostgreSQL offers vastly superior JSONB indexing, rich constraint features, and more powerful procedural capabilities.

## Consequences

- **Positive**: Complete transactional safety, rich query capabilities, unified developer experience, standard SQL ecosystem support.
- **Negative**: Scalability requires read replicas and connection pooling (PgBouncer/RDS Proxy) under extreme concurrency.
