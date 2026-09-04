# ADR 053: SLA Milestone Sweeper and Outbox Event Emissions

## Context

Relying solely on active user requests to discover SLA breaches causes silent failures if an item remains untouched past its deadline. Furthermore, tight in-memory timers risk missing deadlines during system restarts or queue crashes.

## Decision

We implement an asynchronous, PostgreSQL-authoritative SLA Sweeper:

1. **Indexed Milestone Scanning**: The background sweeper queries indexed `(status, warningAt)` and `(status, dueAt)` columns on `sla_instances` for approaching warnings ($\le \text{now}$) and overdue breaches.
2. **Deterministic State Transitions**:
   - Approaching warning $\to$ marks `warningNotified = true`, publishes `sla.warning.v1`.
   - Overdue deadline $\to$ transitions `status = 'BREACHED'`, sets `breachedAt = now`, marks `breachNotified = true`, publishes `sla.breached.v1`.
3. **Queue Resilience & Reconciliation**: The sweeper reconciles directly against the database on startup and via scheduled/on-demand sweeps, ensuring zero missed breaches even after Redis or worker downtime.

## Consequences

- **Positive**: Guaranteed SLA notification delivery, resilience against queue crashes, and complete decoupled notification triggers.
- **Negative**: Sweeper polling frequency determines notification latency for breaches occurring between sweeps.
