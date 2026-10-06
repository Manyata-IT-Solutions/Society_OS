# ADR 067: Deterministic Maintenance Occurrence Idempotency

## Status

Accepted

## Context

Preventive Maintenance (PM) plans execute on recurring schedules (e.g., monthly backup generator test, weekly swimming pool chlorination). In distributed systems or container restarts, background sweeper cron jobs may trigger concurrently or retry failed batches. Without strict idempotency, duplicate Work Orders could be generated for the exact same scheduled maintenance window.

## Decision

We enforce deterministic occurrence keys:

1. Each scheduled occurrence calculates a deterministic key: `occurrenceKey = ${maintenancePlanId}_${scheduledOccurrenceAt.toISOString()}`.
2. The `MaintenancePlanOccurrence` table enforces a unique constraint `@@unique([maintenancePlanId, scheduledOccurrenceAt])`.
3. During generation, an `upsert` or unique insert is performed within a database transaction. If the occurrence record already exists, generation is safely skipped.

## Consequences

- Guaranteed exactly-once generation for scheduled preventive maintenance.
- Robust against scheduler crashes, manual double-clicks, and distributed worker races.
