# ADR-009: Transactional Outbox Pattern for Event Reliability

## Status

Accepted

## Context

As Community OS grows to handle asynchronous workflows (audit logging, notifications, ledger posting, external webhooks), publishing domain events directly in memory or immediately over external message brokers introduces dual-write failure modes (e.g. database commit succeeds, but network failure prevents event dispatch).

## Decision

1. **Phase 1 Event Bus**:
   - Strongly typed `DomainEvent<T>` envelope with `eventId`, `eventType`, `eventVersion`, `occurredAt`, `requestId`, `correlationId`, `organizationId`, and `communityId`.
   - Events are published after successful database transactions.
2. **Transactional Outbox Strategy for Future Modules**:
   - For critical asynchronous side-effects in future phases (e.g., billing, ledger, audit), events will be written directly to an `outbox_events` table within the same database transaction as the entity mutation.
   - A dedicated poller/relay worker (e.g., using PostgreSQL `LISTEN/NOTIFY` or Redis Streams worker) will dispatch outbox records to consumers with at-least-once delivery guarantees and idempotency keys.
3. **Kafka Avoidance**:
   - Heavy distributed infrastructure like Apache Kafka is intentionally avoided at this stage to prevent operational complexity; PostgreSQL outbox + Redis Streams provide ample throughput for this architectural phase.

## Consequences

- **Positive**: Zero data inconsistency between entity state and distributed event streams.
- **Implementation Path**: Phase 1 establishes the event envelope and in-memory bus; outbox table persistence is ready to be plugged in when cross-module async transactions are introduced in subsequent phases.
