# ADR 044: Custom Field Value Storage & Indexing Strategy

## Status

Accepted

## Context

Custom field values must be stored flexibly for heterogeneous data types (strings, numbers, booleans, dates, arrays, and structured objects) while enabling rapid entity lookup and enforcing tenant isolation.

## Decision

We store custom field values in a dedicated `custom_field_values` table utilizing:

1. `JsonB` `value` column storing normalized JSON representations.
2. Unique composite index on `(definitionId, entityType, entityId)` to guarantee at most one value record per field per entity.
3. Denormalized `organizationId` and `communityId` columns with compound indexes to enforce multi-tenant database indexing and query isolation.
4. Foreign key with `ON DELETE CASCADE` to `custom_field_definitions`.

## Consequences

### Positive

- Uniform storage mechanism supporting arbitrary data types without schema alterations.
- High-performance batch updates and lookups per entity.
- Strict referential integrity.

### Negative

- Complex analytical aggregate queries over deeply nested JSON fields require PostgreSQL JSON operators.
