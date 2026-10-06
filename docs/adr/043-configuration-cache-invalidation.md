# ADR 043: Configuration Cache Invalidation Pattern

## Status

Accepted

## Context

Configuration values are accessed on nearly every API request and business operation. Resolving hierarchical database queries repeatedly introduces unnecessary database load.

## Decision

We introduced a Redis-backed caching layer in `ConfigurationResolverService`:

1. Keys are cached with deterministic composite keys: `cfg:${organizationId || '*'}:${communityId || '*'}:${key}` with a 300s TTL.
2. On any override creation, update, or deletion, `invalidateCache(key, scopeType, scopeId)` performs targeted cache clearance using pattern scanning (`delPattern`).
3. Domain events (`configuration.override_updated.v1`, `configuration.override_removed.v1`) are published to allow distributed horizontal nodes to clear in-memory caches.

## Consequences

### Positive

- Sub-millisecond configuration resolution on hot paths.
- Instant cache eviction upon configuration changes.
- Resilient fallback to database queries if Redis is temporarily unreachable.

### Negative

- Pattern-based key deletion requires Redis `KEYS`/`SCAN` execution, which must be carefully scoped to avoid blocking Redis.
