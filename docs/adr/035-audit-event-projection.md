# ADR 035: Audit Event Projection

## Status

Accepted

## Context

Decoupling audit record creation from direct transactional database writes prevents audit persistence overhead from impacting business service latencies.

## Decision

Domain services publish standard domain events (e.g. `unit.move_in_completed.v1`, `role.created.v1`) to the `EventBus`. The `AuditEventSubscriberService` subscribes to these events and asynchronously persists corresponding `AuditRecord` entries.

## Consequences

### Positive

- Business services do not need direct coupling or dependency on `AuditService`.
- Unified projection logic across all domain operations.
