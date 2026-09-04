# ADR 072: Maintenance Lead Time and Schedule Advance Generation

## Status

Accepted

## Context

Complex preventive maintenance (such as annual diesel generator overhaul or fire pump certification) requires advance preparation: scheduling technicians, reserving service bays, and ordering consumables. If a work order is generated only at the exact moment maintenance is due, technicians have zero lead time to prepare.

## Decision

1. Maintenance plans define `leadTimeDays` (e.g. 3 days before scheduled occurrence).
2. The background scheduler queries active plans where `scheduledOccurrenceAt - leadTimeDays <= now`.
3. The generated Work Order is created in `PLANNED` or `ASSIGNED` state with `scheduledOccurrenceAt` preserved for execution timing.

## Consequences

- Operational teams receive advance visibility on upcoming preventive workloads.
- Avoids last-minute scheduling chaos for critical infrastructure.
